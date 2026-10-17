import { NextRequest, NextResponse } from 'next/server';
import { llmJSON, llmEnabled } from '../llm';
import {
  merchantsDB,
  searchProducts,
  type Merchant,
  type Product,
} from '../data';

// POST /api/agents/smart-cart
// Multi-Merchant Smart Cart Agent. The LLM parses intent, while merchant/product
// selection is deterministic so optimization and merchant-cap constraints are auditable.

type Optimization = 'price' | 'rating' | 'distance' | 'balanced';
type ItemCriteria = 'best_price' | 'best_rating' | 'closest' | 'any';

interface SmartCartRequest {
  query: string;
  optimizeFor?: Optimization;
  maxMerchants?: number;
}

interface ParsedItem {
  item: string;
  criteria: ItemCriteria;
  merchantType?: string;
}

interface CartItem {
  productId: string;
  merchantId: string;
  merchantName: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  rating?: number;
  distance: string;
  selectionReason: string;
}

interface Candidate {
  parsedItemIndex: number;
  parsedItem: ParsedItem;
  merchant: Merchant;
  product: Product;
  criterion: ItemCriteria;
  score: number;
}

interface SmartCartResponse {
  success: boolean;
  agent: string;
  timestamp: string;
  parsedRequest: ParsedItem[];
  cart: CartItem[];
  merchants: {
    id: string;
    name: string;
    distance: string;
    prepTime: string;
    itemCount: number;
  }[];
  unmatchedItems: string[];
  summary: {
    totalItems: number;
    requestedItems: number;
    totalMerchants: number;
    subtotal: number;
    estimatedSavings: number;
    optimizationStrategy: Optimization | 'per-item';
  };
  constraints: {
    requestedMaxMerchants: number;
    actualMerchants: number;
    merchantCapSatisfied: boolean;
    requestFulfilled: boolean;
    optimizationApplied: Optimization | 'per-item';
  };
  execution: {
    intentParser: 'gemini' | 'deterministic-fallback';
    selectionEngine: 'deterministic';
    normalizedScoring: true;
    merchantCapEnforced: true;
  };
  aiInsights?: string;
}

const PARSE_SYSTEM_PROMPT = `You are a shopping request parser for an agentic commerce platform.
Parse the user's natural language request into structured items they want to buy.

For each item, identify:
1. item: What product/item they want (e.g., "coffee", "cake", "laptop")
2. criteria: How to select the merchant:
   - "best_price" if they mention cheapest, affordable, budget, lowest price
   - "best_rating" if they mention best, top-rated, highest quality, most popular
   - "closest" if they mention nearest, closest, quickest delivery
   - "any" if no specific preference
3. merchantType: Optional hint about merchant type (e.g., "bakery", "cafe", "electronics store")

Return JSON: { "items": [{ "item": "...", "criteria": "...", "merchantType": "..." }, ...] }`;

async function parseRequest(query: string): Promise<{ items: ParsedItem[]; source: 'gemini' | 'deterministic-fallback' }> {
  if (llmEnabled()) {
    const result = await llmJSON<{ items: ParsedItem[] }>(PARSE_SYSTEM_PROMPT, query);
    if (result?.items && Array.isArray(result.items) && result.items.length > 0) {
      const items = result.items
        .filter(item => item && typeof item.item === 'string' && item.item.trim())
        .map(item => ({
          item: item.item.trim(),
          criteria: isItemCriteria(item.criteria) ? item.criteria : 'any',
          merchantType: typeof item.merchantType === 'string' ? item.merchantType.trim() : undefined,
        }));
      if (items.length > 0) return { items, source: 'gemini' };
    }
  }

  return { items: fallbackParse(query), source: 'deterministic-fallback' };
}

function isItemCriteria(value: unknown): value is ItemCriteria {
  return value === 'best_price' || value === 'best_rating' || value === 'closest' || value === 'any';
}

function fallbackParse(query: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const q = query.toLowerCase();
  const productPatterns = [
    'coffee', 'cake', 'pastry', 'pastries', 'bread', 'biryani', 'dosa',
    'phone', 'laptop', 'watch', 'shirt', 'dress', 'shoes',
    'milk', 'fruits', 'vegetables', 'groceries',
    'skincare', 'perfume', 'makeup',
  ];

  for (const product of productPatterns) {
    if (!q.includes(product)) continue;

    let criteria: ItemCriteria = 'any';
    const patterns = [
      { keywords: ['cheap', 'cheapest', 'budget', 'affordable', 'lowest'], criteria: 'best_price' as const },
      { keywords: ['best', 'top', 'rated', 'quality', 'popular'], criteria: 'best_rating' as const },
      { keywords: ['near', 'close', 'closest', 'quick', 'fast'], criteria: 'closest' as const },
    ];
    for (const pattern of patterns) {
      if (pattern.keywords.some(keyword => q.includes(keyword))) {
        criteria = pattern.criteria;
        break;
      }
    }
    items.push({ item: product, criteria });
  }

  return items.length > 0 ? items : [{ item: query, criteria: 'any' }];
}

function criterionFor(item: ParsedItem, globalOptimization?: Optimization): ItemCriteria {
  if (globalOptimization) {
    if (globalOptimization === 'price') return 'best_price';
    if (globalOptimization === 'rating') return 'best_rating';
    if (globalOptimization === 'distance') return 'closest';
    return 'any';
  }
  return item.criteria;
}

function numberFromDistance(distance: string): number {
  const parsed = Number.parseFloat(distance);
  return Number.isFinite(parsed) ? parsed : 999;
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return (value - min) / (max - min);
}

function scoreCandidates(candidates: Omit<Candidate, 'score'>[]): Candidate[] {
  if (candidates.length === 0) return [];

  const prices = candidates.map(c => c.product.price);
  const ratings = candidates.map(c => c.product.rating ?? c.merchant.rating);
  const distances = candidates.map(c => numberFromDistance(c.merchant.distance));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  return candidates.map(candidate => {
    const priceCost = normalize(candidate.product.price, minPrice, maxPrice);
    const ratingCost = 1 - normalize(candidate.product.rating ?? candidate.merchant.rating, minRating, maxRating);
    const distanceCost = normalize(numberFromDistance(candidate.merchant.distance), minDistance, maxDistance);

    let score: number;
    switch (candidate.criterion) {
      case 'best_price':
        score = priceCost;
        break;
      case 'best_rating':
        score = ratingCost;
        break;
      case 'closest':
        score = distanceCost;
        break;
      default:
        // All terms are normalized before weighting, so dollars cannot dominate ratings/distance.
        score = priceCost * 0.45 + ratingCost * 0.30 + distanceCost * 0.25;
    }
    return { ...candidate, score };
  });
}

async function buildCandidates(
  parsedItems: ParsedItem[],
  globalOptimization?: Optimization,
): Promise<Candidate[][]> {
  const groups: Candidate[][] = [];

  for (let index = 0; index < parsedItems.length; index++) {
    const parsedItem = parsedItems[index];
    const criterion = criterionFor(parsedItem, globalOptimization);
    const raw: Omit<Candidate, 'score'>[] = [];

    for (const merchant of merchantsDB) {
      if (!merchant.isOpen) continue;
      if (parsedItem.merchantType) {
        const hint = parsedItem.merchantType.toLowerCase();
        const typeMatch = merchant.type.toLowerCase().includes(hint) ||
          merchant.category.some(category => category.toLowerCase().includes(hint));
        if (!typeMatch) continue;
      }

      const products = await searchProducts(merchant.id, parsedItem.item);
      for (const product of products) {
        if (!product.inStock || product.quantity <= 0) continue;
        raw.push({ parsedItemIndex: index, parsedItem, merchant, product, criterion });
      }
    }

    groups.push(scoreCandidates(raw));
  }

  return groups;
}

function combinations<T>(values: T[], maxSize: number): T[][] {
  const output: T[][] = [];
  const walk = (start: number, current: T[]) => {
    if (current.length > 0) output.push([...current]);
    if (current.length === maxSize) return;
    for (let i = start; i < values.length; i++) {
      current.push(values[i]);
      walk(i + 1, current);
      current.pop();
    }
  };
  walk(0, []);
  return output;
}

function chooseCart(candidatesByItem: Candidate[][], maxMerchants: number): Candidate[] {
  const merchantIds = Array.from(new Set(candidatesByItem.flat().map(candidate => candidate.merchant.id)));
  if (merchantIds.length === 0) return [];

  const subsets = combinations(merchantIds, Math.min(maxMerchants, merchantIds.length));
  let bestSelection: Candidate[] = [];
  let bestCoverage = -1;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestMerchantCount = Number.POSITIVE_INFINITY;

  for (const subset of subsets) {
    const allowed = new Set(subset);
    const selection: Candidate[] = [];
    let totalScore = 0;

    for (const group of candidatesByItem) {
      const candidate = group
        .filter(option => allowed.has(option.merchant.id))
        .sort((a, b) => a.score - b.score || a.product.price - b.product.price)[0];
      if (candidate) {
        selection.push(candidate);
        totalScore += candidate.score;
      }
    }

    const coverage = selection.length;
    // Prefer complete/highest coverage first, then objective score, then fewer merchants.
    if (
      coverage > bestCoverage ||
      (coverage === bestCoverage && totalScore < bestScore) ||
      (coverage === bestCoverage && totalScore === bestScore && subset.length < bestMerchantCount)
    ) {
      bestSelection = selection;
      bestCoverage = coverage;
      bestScore = totalScore;
      bestMerchantCount = subset.length;
    }
  }

  return bestSelection;
}

function getSelectionReason(criterion: ItemCriteria, merchant: Merchant, product: Product): string {
  switch (criterion) {
    case 'best_price':
      return `Best normalized price match: $${product.price.toFixed(2)} from ${merchant.name}`;
    case 'best_rating':
      return `Best normalized rating match: ${(product.rating ?? merchant.rating).toFixed(1)}★ from ${merchant.name}`;
    case 'closest':
      return `Closest eligible match: ${merchant.distance} from ${merchant.name}`;
    default:
      return `Balanced price, rating and distance match from ${merchant.name}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SmartCartRequest = await request.json();
    const query = body.query;
    const globalOptimization = body.optimizeFor;
    const optimizationApplied: Optimization | 'per-item' = globalOptimization ?? 'per-item';
    const rawMaxMerchants = body.maxMerchants ?? 5;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }
    if (globalOptimization && !['price', 'rating', 'distance', 'balanced'].includes(globalOptimization)) {
      return NextResponse.json({ success: false, error: 'Invalid optimizeFor value' }, { status: 400 });
    }
    if (!Number.isInteger(rawMaxMerchants) || rawMaxMerchants < 1 || rawMaxMerchants > 10) {
      return NextResponse.json({ success: false, error: 'maxMerchants must be an integer between 1 and 10' }, { status: 400 });
    }

    const { items: parsedItems, source: parserSource } = await parseRequest(query.trim());
    const candidatesByItem = await buildCandidates(parsedItems, globalOptimization);
    const selected = chooseCart(candidatesByItem, rawMaxMerchants);

    const selectedByIndex = new Map(selected.map(candidate => [candidate.parsedItemIndex, candidate]));
    const unmatchedItems = parsedItems
      .map((item, index) => selectedByIndex.has(index) ? null : item.item)
      .filter((item): item is string => Boolean(item));

    const cartItems: CartItem[] = selected.map(candidate => ({
      productId: candidate.product.id,
      merchantId: candidate.merchant.id,
      merchantName: candidate.merchant.name,
      name: candidate.product.name,
      price: candidate.product.price,
      quantity: 1,
      image: candidate.product.image,
      rating: candidate.product.rating ?? candidate.merchant.rating,
      distance: candidate.merchant.distance,
      selectionReason: getSelectionReason(candidate.criterion, candidate.merchant, candidate.product),
    }));

    const merchantMap = new Map<string, { merchant: Merchant; itemCount: number }>();
    let estimatedSavings = 0;
    for (const candidate of selected) {
      if (candidate.product.originalPrice && candidate.product.originalPrice > candidate.product.price) {
        estimatedSavings += candidate.product.originalPrice - candidate.product.price;
      }
      const existing = merchantMap.get(candidate.merchant.id);
      if (existing) existing.itemCount += 1;
      else merchantMap.set(candidate.merchant.id, { merchant: candidate.merchant, itemCount: 1 });
    }

    const merchants = Array.from(merchantMap.values()).map(({ merchant, itemCount }) => ({
      id: merchant.id,
      name: merchant.name,
      distance: merchant.distance,
      prepTime: merchant.prepTime,
      itemCount,
    }));

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const requestFulfilled = unmatchedItems.length === 0;

    let aiInsights: string | undefined;
    if (llmEnabled() && cartItems.length > 0) {
      const { llmChat } = await import('../llm');
      const insightPrompt = `Shopping cart: ${cartItems.map(item => `${item.name} from ${item.merchantName}`).join(', ')}. Total: $${subtotal.toFixed(2)}. ${requestFulfilled ? 'All requested items matched.' : `Unmatched: ${unmatchedItems.join(', ')}.`} Give one concise shopping observation. Do not invent prices, discounts, or availability.`;
      aiInsights = (await llmChat([
        { role: 'system', content: 'You are a helpful shopping assistant. Use only facts in the supplied cart summary.' },
        { role: 'user', content: insightPrompt },
      ], { temperature: 0.4 })) || undefined;
    }

    const response: SmartCartResponse = {
      success: cartItems.length > 0,
      agent: 'MultiMerchantSmartCartAgent',
      timestamp: new Date().toISOString(),
      parsedRequest: parsedItems,
      cart: cartItems,
      merchants,
      unmatchedItems,
      summary: {
        totalItems: cartItems.length,
        requestedItems: parsedItems.length,
        totalMerchants: merchants.length,
        subtotal: Number(subtotal.toFixed(2)),
        estimatedSavings: Number(estimatedSavings.toFixed(2)),
        optimizationStrategy: optimizationApplied,
      },
      constraints: {
        requestedMaxMerchants: rawMaxMerchants,
        actualMerchants: merchants.length,
        merchantCapSatisfied: merchants.length <= rawMaxMerchants,
        requestFulfilled,
        optimizationApplied,
      },
      execution: {
        intentParser: parserSource,
        selectionEngine: 'deterministic',
        normalizedScoring: true,
        merchantCapEnforced: true,
      },
      aiInsights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Smart Cart Agent Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
