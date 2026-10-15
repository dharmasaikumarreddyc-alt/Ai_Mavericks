import { NextRequest, NextResponse } from 'next/server';
import { llmJSON, llmEnabled, llmChat } from '../llm';
import {
  merchantsDB,
  searchProducts,
  searchMerchants,
  type Merchant,
  type Product,
} from '../data';

// POST /api/agents/budget-shop
// Budget-Aware Shopping Agent - AI plans shopping within a budget constraint
// Intelligently allocates budget, finds best deals, suggests alternatives

interface BudgetShopRequest {
  budget: number; // Total budget in USD
  items: string[]; // Items wanted, e.g., ["coffee", "cake", "laptop"]
  priorities?: string[]; // Optional: which items are must-haves
  flexibility?: 'strict' | 'flexible' | 'very_flexible';
}

interface BudgetAllocation {
  item: string;
  allocatedBudget: number;
  priority: 'must_have' | 'nice_to_have' | 'optional';
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
  budget: {
    total: number;
    allocated: number;
    remaining: number;
    utilizationPercent: number;
  };
  allocations: BudgetAllocation[];
  selectedProducts: SelectedProduct[];
  alternatives: Alternative[];
  summary: {
    itemsFound: number;
    itemsRequested: number;
    totalSavings: number;
    withinBudget: boolean;
  };
  aiAdvice?: string;
}

const BUDGET_ALLOCATION_PROMPT = `You are a smart budget allocation AI for shopping.
Given a total budget and list of items, allocate the budget intelligently.

Consider:
1. Typical price ranges for items (coffee ~$3-7, cake ~$15-40, laptop ~$500-2000)
2. User's priorities (must-haves get more budget allocation)
3. Leave some buffer for taxes/fees

Return JSON:
{
  "allocations": [
    { "item": "...", "allocatedBudget": number, "priority": "must_have|nice_to_have|optional" }
  ],
  "reasoning": "Brief explanation"
}`;

// Allocate budget using LLM
async function allocateBudget(
  budget: number,
  items: string[],
  priorities: string[] = []
): Promise<BudgetAllocation[]> {
  if (!llmEnabled()) {
    return fallbackAllocate(budget, items, priorities);
  }

  const prompt = `Budget: $${budget}
Items: ${items.join(', ')}
Priorities (must-haves): ${priorities.length > 0 ? priorities.join(', ') : 'none specified'}`;

  const result = await llmJSON<{
    allocations: { item: string; allocatedBudget: number; priority: string }[];
  }>(BUDGET_ALLOCATION_PROMPT, prompt);

  if (result?.allocations) {
    return result.allocations.map((a) => ({
      item: a.item,
      allocatedBudget: a.allocatedBudget,
      priority: a.priority as BudgetAllocation['priority'],
      isPriority: priorities.includes(a.item) || a.priority === 'must_have',
    }));
  }

  return fallbackAllocate(budget, items, priorities);
}

// Fallback budget allocation
function fallbackAllocate(
  budget: number,
  items: string[],
  priorities: string[]
): BudgetAllocation[] {
  // Estimate typical prices for common categories
  const priceEstimates: Record<string, number> = {
    coffee: 150,
    cake: 500,
    pastry: 150,
    bread: 80,
    biryani: 350,
    dosa: 80,
    laptop: 50000,
    phone: 25000,
    watch: 5000,
    shirt: 1500,
    dress: 2500,
    shoes: 3000,
    milk: 60,
    fruits: 200,
    vegetables: 300,
    groceries: 500,
    skincare: 800,
    perfume: 2000,
  };

  // Calculate total estimated cost
  let totalEstimate = 0;
  const estimates = items.map((item) => {
    const itemLower = item.toLowerCase();
    const estimate = Object.entries(priceEstimates).find(([key]) =>
      itemLower.includes(key)
    )?.[1] || 500;
    totalEstimate += estimate;
    return { item, estimate };
  });

  // Scale allocations to fit budget
  const scale = Math.min(1, budget / totalEstimate);

  return estimates.map(({ item, estimate }) => ({
    item,
    allocatedBudget: Math.round(estimate * scale),
    priority: priorities.includes(item) ? 'must_have' : 'nice_to_have',
    isPriority: priorities.includes(item),
  }));
}

// Find best product within budget for an item
async function findProductWithinBudget(
  item: string,
  maxBudget: number,
  flexibility: string
): Promise<{ product: Product; merchant: Merchant } | null> {
  // Search for merchants that have this item
  const merchants = await searchMerchants(item);

  const candidates: { product: Product; merchant: Merchant; score: number }[] = [];

  for (const merchant of merchants.slice(0, 5)) {
    const products = await searchProducts(merchant.id, item);

    for (const product of products) {
      // Check if within budget (with flexibility)
      const budgetMultiplier =
        flexibility === 'very_flexible' ? 1.3 :
        flexibility === 'flexible' ? 1.15 : 1.0;

      if (product.price <= maxBudget * budgetMultiplier) {
        // Score based on value (rating/price ratio) and being under budget
        const underBudgetBonus = product.price <= maxBudget ? 50 : 0;
        const ratingScore = (product.rating || merchant.rating) * 10;
        const priceScore = 100 - (product.price / maxBudget) * 50;
        const savingsScore = product.originalPrice
          ? ((product.originalPrice - product.price) / product.originalPrice) * 30
          : 0;

        const score = underBudgetBonus + ratingScore + priceScore + savingsScore;

        candidates.push({ product, merchant, score });
      }
    }
  }

  // Sort by score and return best
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ? { product: candidates[0].product, merchant: candidates[0].merchant } : null;
}

// Generate alternatives for items that couldn't be found within budget
function generateAlternatives(
  item: string,
  allocatedBudget: number,
  foundProduct: Product | null
): Alternative[] {
  const alternatives: Alternative[] = [];

  if (!foundProduct) {
    // Item not found at all
    alternatives.push({
      originalItem: item,
      suggestion: `Consider a more specific search for "${item}"`,
      reason: 'Product not found in available merchants',
      estimatedPrice: allocatedBudget,
    });
  } else if (foundProduct.price > allocatedBudget) {
    // Found but over budget
    alternatives.push({
      originalItem: item,
      suggestion: `${foundProduct.name} ($${foundProduct.price})`,
      reason: `Over budget by $${foundProduct.price - allocatedBudget}, but best available option`,
      estimatedPrice: foundProduct.price,
    });
  }

  return alternatives;
}

export async function POST(request: NextRequest) {
  try {
    const body: BudgetShopRequest = await request.json();
    const { budget, items, priorities = [], flexibility = 'flexible' } = body;

    if (!budget || budget <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid budget is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Step 1: Allocate budget across items
    const allocations = await allocateBudget(budget, items, priorities);

    // Step 2: Find best products within each allocation
    const selectedProducts: SelectedProduct[] = [];
    const alternatives: Alternative[] = [];
    let totalSavings = 0;
    let totalAllocated = 0;

    for (const allocation of allocations) {
      const result = await findProductWithinBudget(
        allocation.item,
        allocation.allocatedBudget,
        flexibility
      );

      if (result) {
        const { product, merchant } = result;
        const withinBudget = product.price <= allocation.allocatedBudget;
        const savings = product.originalPrice
          ? product.originalPrice - product.price
          : 0;
        totalSavings += savings;
        totalAllocated += product.price;

        selectedProducts.push({
          productId: product.id,
          merchantId: merchant.id,
          merchantName: merchant.name,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          savings: savings > 0 ? savings : undefined,
          quantity: 1,
          image: product.image,
          category: product.category,
          withinBudget,
          budgetImpact: withinBudget
            ? `$${allocation.allocatedBudget - product.price} under budget`
            : `$${product.price - allocation.allocatedBudget} over allocated budget`,
        });

        // Add alternatives if over budget
        if (!withinBudget) {
          alternatives.push(...generateAlternatives(allocation.item, allocation.allocatedBudget, product));
        }
      } else {
        // No product found
        alternatives.push(...generateAlternatives(allocation.item, allocation.allocatedBudget, null));
      }
    }

    // Generate AI advice
    let aiAdvice: string | undefined;
    if (llmEnabled()) {
      const advicePrompt = `Budget: $${budget}. Found ${selectedProducts.length}/${items.length} items. Total: $${totalAllocated}. ${
        totalAllocated > budget ? 'Over budget!' : `$${budget - totalAllocated} remaining.`
      } Give 1 brief shopping tip.`;

      aiAdvice = (await llmChat([
        { role: 'system', content: 'You are a budget shopping advisor. Be brief and helpful.' },
        { role: 'user', content: advicePrompt }
      ], { temperature: 0.7 })) || undefined;
    }

    const response: BudgetShopResponse = {
      success: true,
      agent: 'BudgetAwareShoppingAgent',
      timestamp: new Date().toISOString(),
      budget: {
        total: budget,
        allocated: totalAllocated,
        remaining: budget - totalAllocated,
        utilizationPercent: Math.round((totalAllocated / budget) * 100),
      },
      allocations,
      selectedProducts,
      alternatives,
      summary: {
        itemsFound: selectedProducts.length,
        itemsRequested: items.length,
        totalSavings,
        withinBudget: totalAllocated <= budget,
      },
      aiAdvice,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Budget Shop Agent Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
