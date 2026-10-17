import { NextRequest, NextResponse } from 'next/server';
import { llmJSON, llmEnabled, llmChat } from '../llm';
import {
  merchantsDB,
  searchProducts,
  type Merchant,
  type Product,
} from '../data';

// POST /api/agents/budget-shop
// Budget-Aware Shopping Agent. Gemini can propose the allocation, while a
// deterministic selector guarantees that the final basket never exceeds the
// user's total budget.

type Flexibility = 'strict' | 'flexible' | 'very_flexible';
type Priority = 'must_have' | 'nice_to_have' | 'optional';
type PlannerSource = 'gemini' | 'deterministic-fallback';

interface BudgetShopRequest {
  budget: number;
  items: string[];
  priorities?: string[];
  flexibility?: Flexibility;
}

interface BudgetAllocation {
  item: string;
  allocatedBudget: number;
  priority: Priority;
  isPriority: boolean;
}

interface SelectedProduct {
  productId: string;
  merchantId: string;
  merchantName: string;
  name: string;
  price: number;
  originalPrice?: number;
  savings?: number;
  quantity: number;
  image: string;
  category: string;
  withinBudget: boolean;
  budgetImpact: string;
}

interface Alternative {
  originalItem: string;
  suggestion: string;
  reason: string;
  estimatedPrice: number;
}

interface BudgetShopResponse {
  success: boolean;
  agent: string;
  timestamp: string;
  currency: 'USD';
  budget: {
    total: number;
    allocated: number;
    remaining: number;
    utilizationPercent: number;
  };
  allocations: BudgetAllocation[];
  selectedProducts: SelectedProduct[];
  alternatives: Alternative[];
  unmatchedItems: string[];
  summary: {
    itemsFound: number;
    itemsRequested: number;
    totalSavings: number;
    withinBudget: boolean;
  };
  execution: {
    allocationPlanner: PlannerSource;
    selectionEngine: 'deterministic';
    currency: 'USD';
    totalBudgetGuardEnforced: true;
  };
  aiAdvice?: string;
}

const CURRENCY = 'USD' as const;

// Values deliberately match the synthetic USD catalog used by the demo.
const USD_PRICE_ESTIMATES: Record<string, number> = {
  coffee: 6,
  cake: 30,
  pastry: 5,
  bread: 6,
  biryani: 15,
  dosa: 10,
  laptop: 800,
  phone: 700,
  watch: 150,
  shirt: 45,
  dress: 80,
  shoes: 100,
  milk: 5,
  fruits: 15,
  vegetables: 15,
  groceries: 75,
  skincare: 35,
  perfume: 90,
  makeup: 40,
};

const BUDGET_ALLOCATION_PROMPT = `You are a budget-allocation planner for a shopping agent.
The catalog uses USD. Allocate the supplied total budget across the requested items.
Must-have items should receive priority, but the sum of allocations must not exceed the total budget.
Return JSON only:
{
  "allocations": [
    { "item": "...", "allocatedBudget": number, "priority": "must_have|nice_to_have|optional" }
  ]
}`;

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function isPriorityItem(item: string, priorities: string[]): boolean {
  const target = normalized(item);
  return priorities.some(priority => normalized(priority) === target);
}

function validPriority(value: unknown): value is Priority {
  return value === 'must_have' || value === 'nice_to_have' || value === 'optional';
}

function sanitizeAllocations(
  allocations: { item: string; allocatedBudget: number; priority: string }[],
  budget: number,
  items: string[],
  priorities: string[],
): BudgetAllocation[] | null {
  const byItem = new Map<string, { allocatedBudget: number; priority: string }>();
  for (const allocation of allocations) {
    if (!allocation || typeof allocation.item !== 'string') continue;
    if (!Number.isFinite(allocation.allocatedBudget) || allocation.allocatedBudget < 0) continue;
    byItem.set(normalized(allocation.item), allocation);
  }

  // Do not trust an incomplete LLM plan. Fall back deterministically instead.
  if (items.some(item => !byItem.has(normalized(item)))) return null;

  const raw = items.map(item => {
    const allocation = byItem.get(normalized(item))!;
    const priority = isPriorityItem(item, priorities)
      ? 'must_have'
      : validPriority(allocation.priority)
        ? allocation.priority
        : 'nice_to_have';
    return {
      item,
      allocatedBudget: Math.max(0, allocation.allocatedBudget),
      priority,
      isPriority: priority === 'must_have',
    } satisfies BudgetAllocation;
  });

  const total = raw.reduce((sum, allocation) => sum + allocation.allocatedBudget, 0);
  const scale = total > budget && total > 0 ? budget / total : 1;
  const scaled = raw.map(allocation => ({
    ...allocation,
    allocatedBudget: Math.floor(allocation.allocatedBudget * scale * 100) / 100,
  }));

  return scaled;
}

async function allocateBudget(
  budget: number,
  items: string[],
  priorities: string[],
): Promise<{ allocations: BudgetAllocation[]; source: PlannerSource }> {
  if (llmEnabled()) {
    const prompt = `Total budget: ${money(budget)}\nItems: ${items.join(', ')}\nMust-haves: ${priorities.length > 0 ? priorities.join(', ') : 'none'}`;
    const result = await llmJSON<{
      allocations: { item: string; allocatedBudget: number; priority: string }[];
    }>(BUDGET_ALLOCATION_PROMPT, prompt);

    if (Array.isArray(result?.allocations)) {
      const sanitized = sanitizeAllocations(result.allocations, budget, items, priorities);
      if (sanitized) return { allocations: sanitized, source: 'gemini' };
    }
  }

  return {
    allocations: fallbackAllocate(budget, items, priorities),
    source: 'deterministic-fallback',
  };
}

function fallbackAllocate(
  budget: number,
  items: string[],
  priorities: string[],
): BudgetAllocation[] {
  const estimates = items.map(item => {
    const itemLower = normalized(item);
    const estimate = Object.entries(USD_PRICE_ESTIMATES).find(([key]) => itemLower.includes(key))?.[1] ?? 25;
    const priority = isPriorityItem(item, priorities);
    // Priority weighting only affects allocation share; the final total is still hard-capped.
    return { item, estimate, weightedEstimate: estimate * (priority ? 1.25 : 1), priority };
  });

  const totalWeighted = estimates.reduce((sum, entry) => sum + entry.weightedEstimate, 0);
  const scale = totalWeighted > 0 ? Math.min(1, budget / totalWeighted) : 0;

  return estimates.map(entry => ({
    item: entry.item,
    allocatedBudget: Math.floor(entry.weightedEstimate * scale * 100) / 100,
    priority: entry.priority ? 'must_have' : 'nice_to_have',
    isPriority: entry.priority,
  }));
}

function flexibilityMultiplier(flexibility: Flexibility): number {
  if (flexibility === 'very_flexible') return 1.3;
  if (flexibility === 'flexible') return 1.15;
  return 1;
}

async function findProductWithinBudget(
  item: string,
  allocatedBudget: number,
  remainingTotalBudget: number,
  flexibility: Flexibility,
): Promise<{ product: Product; merchant: Merchant } | null> {
  const hardSpendLimit = Math.min(
    remainingTotalBudget,
    allocatedBudget * flexibilityMultiplier(flexibility),
  );
  if (hardSpendLimit <= 0) return null;

  const candidates: { product: Product; merchant: Merchant }[] = [];
  for (const merchant of merchantsDB) {
    if (!merchant.isOpen) continue;
    const products = await searchProducts(merchant.id, item);
    for (const product of products) {
      if (!product.inStock || product.quantity <= 0 || product.price > hardSpendLimit) continue;
      candidates.push({ product, merchant });
    }
  }

  if (candidates.length === 0) return null;

  const prices = candidates.map(candidate => candidate.product.price);
  const ratings = candidates.map(candidate => candidate.product.rating ?? candidate.merchant.rating);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const norm = (value: number, min: number, max: number) => max <= min ? 0 : (value - min) / (max - min);

  candidates.sort((a, b) => {
    const score = (candidate: { product: Product; merchant: Merchant }) => {
      const priceCost = norm(candidate.product.price, minPrice, maxPrice);
      const ratingCost = 1 - norm(candidate.product.rating ?? candidate.merchant.rating, minRating, maxRating);
      const allocationPenalty = candidate.product.price > allocatedBudget ? 0.25 : 0;
      const discount = candidate.product.originalPrice && candidate.product.originalPrice > candidate.product.price
        ? (candidate.product.originalPrice - candidate.product.price) / candidate.product.originalPrice
        : 0;
      return priceCost * 0.55 + ratingCost * 0.30 + allocationPenalty - discount * 0.15;
    };
    return score(a) - score(b) || a.product.price - b.product.price;
  });

  return candidates[0];
}

function generateAlternative(item: string, allocatedBudget: number): Alternative {
  return {
    originalItem: item,
    suggestion: `Try a lower-priced or more specific alternative for "${item}"`,
    reason: `No in-stock catalog match fit the current ${money(allocatedBudget)} allocation and remaining total budget`,
    estimatedPrice: allocatedBudget,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: BudgetShopRequest = await request.json();
    const { budget, priorities = [], flexibility = 'flexible' } = body;
    const items = Array.isArray(body.items)
      ? body.items.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
      : [];

    if (!Number.isFinite(budget) || budget <= 0) {
      return NextResponse.json({ success: false, error: 'A positive finite budget is required' }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one item is required' }, { status: 400 });
    }
    if (items.length > 25) {
      return NextResponse.json({ success: false, error: 'A maximum of 25 items is supported per request' }, { status: 400 });
    }
    if (!['strict', 'flexible', 'very_flexible'].includes(flexibility)) {
      return NextResponse.json({ success: false, error: 'Invalid flexibility value' }, { status: 400 });
    }

    const { allocations, source: plannerSource } = await allocateBudget(budget, items, priorities);

    // Must-haves consume the shared budget first. Original ordering is restored in the response.
    const allocationOrder = allocations
      .map((allocation, index) => ({ allocation, index }))
      .sort((a, b) => Number(b.allocation.isPriority) - Number(a.allocation.isPriority) || a.index - b.index);

    const selectedByItemIndex = new Map<number, SelectedProduct>();
    const alternatives: Alternative[] = [];
    const unmatchedItems: string[] = [];
    let totalSpent = 0;
    let totalSavings = 0;

    for (const { allocation, index } of allocationOrder) {
      const remainingTotalBudget = Math.max(0, budget - totalSpent);
      const result = await findProductWithinBudget(
        allocation.item,
        allocation.allocatedBudget,
        remainingTotalBudget,
        flexibility,
      );

      if (!result) {
        unmatchedItems.push(allocation.item);
        alternatives.push(generateAlternative(allocation.item, allocation.allocatedBudget));
        continue;
      }

      const { product, merchant } = result;
      // Defensive guard: never allow floating-point or upstream changes to violate total budget.
      if (totalSpent + product.price > budget + Number.EPSILON) {
        unmatchedItems.push(allocation.item);
        alternatives.push(generateAlternative(allocation.item, allocation.allocatedBudget));
        continue;
      }

      const savings = product.originalPrice && product.originalPrice > product.price
        ? product.originalPrice - product.price
        : 0;
      totalSpent += product.price;
      totalSavings += savings;
      const withinAllocation = product.price <= allocation.allocatedBudget;

      selectedByItemIndex.set(index, {
        productId: product.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        savings: savings > 0 ? Number(savings.toFixed(2)) : undefined,
        quantity: 1,
        image: product.image,
        category: product.category,
        withinBudget: withinAllocation,
        budgetImpact: withinAllocation
          ? `${money(allocation.allocatedBudget - product.price)} under item allocation`
          : `${money(product.price - allocation.allocatedBudget)} above item allocation, still inside total budget`,
      });
    }

    const selectedProducts = allocations
      .map((_, index) => selectedByItemIndex.get(index))
      .filter((product): product is SelectedProduct => Boolean(product));

    const safeSpent = Number(totalSpent.toFixed(2));
    const remaining = Number(Math.max(0, budget - safeSpent).toFixed(2));
    const withinBudget = safeSpent <= budget;

    let aiAdvice: string | undefined;
    if (llmEnabled()) {
      const advicePrompt = `Currency: USD. Total budget: ${money(budget)}. Found ${selectedProducts.length}/${items.length} items. Spent: ${money(safeSpent)}. Remaining: ${money(remaining)}. Unmatched: ${unmatchedItems.length ? unmatchedItems.join(', ') : 'none'}. Give one concise shopping tip using only these facts.`;
      aiAdvice = (await llmChat([
        { role: 'system', content: 'You are a budget shopping advisor. Never invent prices, discounts, products, or availability.' },
        { role: 'user', content: advicePrompt },
      ], { temperature: 0.3 })) || undefined;
    }

    const response: BudgetShopResponse = {
      success: selectedProducts.length > 0,
      agent: 'BudgetAwareShoppingAgent',
      timestamp: new Date().toISOString(),
      currency: CURRENCY,
      budget: {
        total: budget,
        allocated: safeSpent,
        remaining,
        utilizationPercent: Math.round((safeSpent / budget) * 100),
      },
      allocations,
      selectedProducts,
      alternatives,
      unmatchedItems,
      summary: {
        itemsFound: selectedProducts.length,
        itemsRequested: items.length,
        totalSavings: Number(totalSavings.toFixed(2)),
        withinBudget,
      },
      execution: {
        allocationPlanner: plannerSource,
        selectionEngine: 'deterministic',
        currency: CURRENCY,
        totalBudgetGuardEnforced: true,
      },
      aiAdvice,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Budget Shop Agent Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
