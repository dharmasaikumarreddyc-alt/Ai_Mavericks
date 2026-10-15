import { NextRequest, NextResponse } from 'next/server';
import { llmJSON, llmEnabled } from '../llm';
import {
  merchantsDB,
  searchProducts,
  getMerchantProducts,
  type Merchant,
  type Product,
} from '../data';

// POST /api/agents/smart-cart
// Multi-Merchant Smart Cart Agent - AI combines orders from multiple merchants
// to optimize for best price, rating, distance, or user preference.

interface SmartCartRequest {
  query: string; // e.g., "Get me coffee from the best rated place and cake from the cheapest bakery"
  optimizeFor?: 'price' | 'rating' | 'distance' | 'balanced';
  maxMerchants?: number;
}

interface ParsedItem {
  item: string;
  criteria: 'best_price' | 'best_rating' | 'closest' | 'any';
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
  summary: {
    totalItems: number;
    totalMerchants: number;
    subtotal: number;
    estimatedSavings: number;
    optimizationStrategy: string;
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

Return JSON: { "items": [{ "item": "...", "criteria": "...", "merchantType": "..." }, ...] }

Examples:
- "coffee from the best cafe and pastries from a cheap bakery"
  → { "items": [{ "item": "coffee", "criteria": "best_rating", "merchantType": "cafe" }, { "item": "pastries", "criteria": "best_price", "merchantType": "bakery" }] }
- "I need a laptop and also some groceries"
  → { "items": [{ "item": "laptop", "criteria": "any" }, { "item": "groceries", "criteria": "any" }] }`;

// Parse user request using LLM
async function parseRequest(query: string): Promise<ParsedItem[]> {
  if (!llmEnabled()) {
    return fallbackParse(query);
  }

  const result = await llmJSON<{ items: ParsedItem[] }>(
    PARSE_SYSTEM_PROMPT,
    query
  );

  if (result?.items && Array.isArray(result.items)) {
    return result.items;
  }

  return fallbackParse(query);
}

// Fallback keyword-based parsing
function fallbackParse(query: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const q = query.toLowerCase();

  // Common product patterns
  const productPatterns = [
    'coffee', 'cake', 'pastry', 'pastries', 'bread', 'biryani', 'dosa',
    'phone', 'laptop', 'watch', 'shirt', 'dress', 'shoes',
    'milk', 'fruits', 'vegetables', 'groceries',
    'skincare', 'perfume', 'makeup'
  ];

  for (const product of productPatterns) {
    if (q.includes(product)) {
      let criteria: ParsedItem['criteria'] = 'any';

      // Check surrounding context for criteria
      const patterns = [
        { keywords: ['cheap', 'cheapest', 'budget', 'affordable', 'lowest'], criteria: 'best_price' as const },
        { keywords: ['best', 'top', 'rated', 'quality', 'popular'], criteria: 'best_rating' as const },
        { keywords: ['near', 'close', 'closest', 'quick', 'fast'], criteria: 'closest' as const },
      ];

      for (const pattern of patterns) {
        if (pattern.keywords.some(kw => q.includes(kw))) {
          criteria = pattern.criteria;
          break;
        }
      }

      items.push({ item: product, criteria });
    }
  }

  // If no specific products found, treat the whole query as one item
  if (items.length === 0) {
    items.push({ item: query, criteria: 'any' });
  }

  return items;
}

// Find best merchant for an item based on criteria
async function findBestMerchant(
  parsedItem: ParsedItem
): Promise<{ merchant: Merchant; products: Product[] } | null> {
  const { item, criteria, merchantType } = parsedItem;

  // Find merchants with matching products
  const merchantMatches: { merchant: Merchant; products: Product[]; score: number }[] = [];

  for (const merchant of merchantsDB) {
    if (!merchant.isOpen) continue;

    // Check if merchant type matches (if specified)
    if (merchantType) {
      const typeMatch = merchant.type.toLowerCase().includes(merchantType.toLowerCase()) ||
        merchant.category.some(c => c.includes(merchantType.toLowerCase()));
      if (!typeMatch) continue;
    }

    // Search for products
    const products = await searchProducts(merchant.id, item);
    if (products.length === 0) continue;

    // Calculate score based on criteria
    let score = 0;
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const avgRating = products.reduce((sum, p) => sum + (p.rating || merchant.rating), 0) / products.length;
    const distance = parseFloat(merchant.distance);

    switch (criteria) {
      case 'best_price':
        score = 1000 - avgPrice; // Lower price = higher score
        break;
      case 'best_rating':
        score = avgRating * 100 + merchant.rating * 50;
        break;
      case 'closest':
        score = 100 - distance * 10; // Closer = higher score
        break;
      default:
        // Balanced: consider all factors
        score = (avgRating * 20) + (100 - avgPrice / 10) + (50 - distance * 5);
    }

    merchantMatches.push({ merchant, products, score });
  }

  // Sort by score and return best match
  merchantMatches.sort((a, b) => b.score - a.score);
  return merchantMatches[0] || null;
}

// Generate selection reason
function getSelectionReason(criteria: string, merchant: Merchant, product: Product): string {
  switch (criteria) {
    case 'best_price':
      return `Lowest price at $${product.price} from ${merchant.name}`;
    case 'best_rating':
      return `Top rated (${product.rating || merchant.rating}★) from ${merchant.name}`;
    case 'closest':
      return `Nearest option at ${merchant.distance} from ${merchant.name}`;
    default:
      return `Selected from ${merchant.name} (${merchant.rating}★, ${merchant.distance})`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SmartCartRequest = await request.json();
    const { query, optimizeFor = 'balanced', maxMerchants = 5 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Step 1: Parse the request using AI
    const parsedItems = await parseRequest(query);

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not understand the request' },
        { status: 400 }
      );
    }

    // Step 2: Find best merchants for each item
    const cartItems: CartItem[] = [];
    const merchantMap = new Map<string, { merchant: Merchant; itemCount: number }>();
    let estimatedSavings = 0;

    for (const parsedItem of parsedItems) {
      const match = await findBestMerchant(parsedItem);
      if (!match) continue;

      const { merchant, products } = match;

      // Select the best product from this merchant
      const product = products.sort((a, b) => {
        if (parsedItem.criteria === 'best_price') return a.price - b.price;
        if (parsedItem.criteria === 'best_rating') return (b.rating || 0) - (a.rating || 0);
        return 0;
      })[0];

      // Calculate savings if there's an original price
      if (product.originalPrice && product.originalPrice > product.price) {
        estimatedSavings += product.originalPrice - product.price;
      }

      cartItems.push({
        productId: product.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        rating: product.rating || merchant.rating,
        distance: merchant.distance,
        selectionReason: getSelectionReason(parsedItem.criteria, merchant, product),
      });

      // Track merchants
      const existing = merchantMap.get(merchant.id);
      if (existing) {
        existing.itemCount++;
      } else {
        merchantMap.set(merchant.id, { merchant, itemCount: 1 });
      }
    }

    // Build merchant summary
    const merchants = Array.from(merchantMap.values())
      .slice(0, maxMerchants)
      .map(({ merchant, itemCount }) => ({
        id: merchant.id,
        name: merchant.name,
        distance: merchant.distance,
        prepTime: merchant.prepTime,
        itemCount,
      }));

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Generate AI insights if LLM is available
    let aiInsights: string | undefined;
    if (llmEnabled() && cartItems.length > 0) {
      const insightPrompt = `Shopping cart summary: ${cartItems.map(i => `${i.name} from ${i.merchantName}`).join(', ')}. Total: $${subtotal}. Give a 1-sentence shopping tip or observation.`;
      const { llmChat } = await import('../llm');
      aiInsights = (await llmChat([
        { role: 'system', content: 'You are a helpful shopping assistant. Give brief, friendly tips.' },
        { role: 'user', content: insightPrompt }
      ], { temperature: 0.7 })) || undefined;
    }

    const response: SmartCartResponse = {
      success: true,
      agent: 'MultiMerchantSmartCartAgent',
      timestamp: new Date().toISOString(),
      parsedRequest: parsedItems,
      cart: cartItems,
      merchants,
      summary: {
        totalItems: cartItems.length,
        totalMerchants: merchants.length,
        subtotal,
        estimatedSavings,
        optimizationStrategy: optimizeFor,
      },
      aiInsights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Smart Cart Agent Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
