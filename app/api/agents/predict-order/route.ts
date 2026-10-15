import { NextRequest, NextResponse } from 'next/server';
import { llmJSON, llmEnabled, llmChat } from '../llm';
import {
  merchantsDB,
  localProductsDB,
  searchMerchants,
  getMerchantProducts,
  type Merchant,
  type Product,
} from '../data';

// POST /api/agents/predict-order
// Predictive Auto-Ordering Agent - AI learns user patterns and suggests orders proactively

interface OrderHistory {
  orderId: string;
  merchantId: string;
  items: { productId: string; name: string; quantity: number }[];
  total: number;
  timestamp: string; // ISO date string
  dayOfWeek?: number;
  hourOfDay?: number;
}

interface PredictOrderRequest {
  userId?: string;
  orderHistory: OrderHistory[];
  currentTime?: string; // ISO date string, defaults to now
  preferences?: {
    dietary?: string[];
    favoriteCategories?: string[];
    budgetRange?: { min: number; max: number };
  };
}

interface PredictedItem {
  productId: string;
  merchantId: string;
  merchantName: string;
  name: string;
  price: number;
  image: string;
  confidence: number; // 0-100
  reason: string;
  lastOrdered?: string;
  orderFrequency?: string;
}

interface Pattern {
  type: 'time_based' | 'frequency' | 'combination' | 'seasonal';
  description: string;
  confidence: number;
  items: string[];
}

interface PredictOrderResponse {
  success: boolean;
  agent: string;
  timestamp: string;
  predictions: PredictedItem[];
  patterns: Pattern[];
  suggestedCart: {
    items: PredictedItem[];
    estimatedTotal: number;
    confidence: number;
  };
  timing: {
    bestTimeToOrder: string;
    nextPredictedOrder: string;
    urgency: 'low' | 'medium' | 'high';
  };
  aiInsight?: string;
}

const PATTERN_ANALYSIS_PROMPT = `You are an AI that analyzes shopping patterns for predictive ordering.
Given order history, identify patterns and predict what the user might want next.

Look for:
1. Time-based patterns (morning coffee, weekend groceries)
2. Frequency patterns (weekly milk, monthly supplies)
3. Combination patterns (always orders X with Y)
4. Seasonal/weather patterns

Return JSON:
{
  "patterns": [
    { "type": "time_based|frequency|combination|seasonal", "description": "...", "confidence": 0-100, "items": ["item1", "item2"] }
  ],
  "predictedItems": ["item1", "item2"],
  "bestTimeToOrder": "morning|afternoon|evening|night",
  "reasoning": "Brief explanation"
}`;

// Analyze patterns using LLM
async function analyzePatterns(orderHistory: OrderHistory[]): Promise<{
  patterns: Pattern[];
  predictedItems: string[];
  bestTimeToOrder: string;
}> {
  if (!llmEnabled() || orderHistory.length === 0) {
    return fallbackPatternAnalysis(orderHistory);
  }

  const historyText = orderHistory
    .slice(-20) // Last 20 orders
    .map((o) => {
      const date = new Date(o.timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}: ${o.items.map((i) => i.name).join(', ')} from merchant ${o.merchantId}`;
    })
    .join('\n');

  const result = await llmJSON<{
    patterns: Pattern[];
    predictedItems: string[];
    bestTimeToOrder: string;
  }>(PATTERN_ANALYSIS_PROMPT, `Order History:\n${historyText}`);

  if (result?.patterns) {
    return {
      patterns: result.patterns,
      predictedItems: result.predictedItems || [],
      bestTimeToOrder: result.bestTimeToOrder || 'morning',
    };
  }

  return fallbackPatternAnalysis(orderHistory);
}

// Fallback pattern analysis
function fallbackPatternAnalysis(orderHistory: OrderHistory[]): {
  patterns: Pattern[];
  predictedItems: string[];
  bestTimeToOrder: string;
} {
  const patterns: Pattern[] = [];
  const itemCounts: Record<string, number> = {};
  const timeSlots: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const daySlots: Record<number, string[]> = {};

  for (const order of orderHistory) {
    const date = new Date(order.timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    // Count items
    for (const item of order.items) {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    }

    // Count time slots
    if (hour >= 6 && hour < 12) timeSlots.morning++;
    else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
    else if (hour >= 17 && hour < 21) timeSlots.evening++;
    else timeSlots.night++;

    // Track items by day
    if (!daySlots[day]) daySlots[day] = [];
    daySlots[day].push(...order.items.map((i) => i.name));
  }

  // Find most ordered items
  const sortedItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sortedItems.length > 0) {
    patterns.push({
      type: 'frequency',
      description: `Frequently ordered: ${sortedItems.map(([name]) => name).join(', ')}`,
      confidence: Math.min(90, 50 + sortedItems[0][1] * 5),
      items: sortedItems.map(([name]) => name),
    });
  }

  // Find best time slot
  const bestSlot = Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0];
  if (bestSlot[1] > 0) {
    patterns.push({
      type: 'time_based',
      description: `Usually orders in the ${bestSlot[0]}`,
      confidence: Math.round((bestSlot[1] / orderHistory.length) * 100),
      items: [],
    });
  }

  return {
    patterns,
    predictedItems: sortedItems.slice(0, 3).map(([name]) => name),
    bestTimeToOrder: bestSlot[0],
  };
}

// Find products matching predicted items
async function findPredictedProducts(
  predictedItems: string[],
  orderHistory: OrderHistory[]
): Promise<PredictedItem[]> {
  const predictions: PredictedItem[] = [];
  const itemLastOrdered: Record<string, string> = {};
  const itemOrderCount: Record<string, number> = {};

  // Build item history
  for (const order of orderHistory) {
    for (const item of order.items) {
      itemLastOrdered[item.name] = order.timestamp;
      itemOrderCount[item.name] = (itemOrderCount[item.name] || 0) + 1;
    }
  }

  for (const itemName of predictedItems) {
    // Search for this item
    const merchants = await searchMerchants(itemName);

    for (const merchant of merchants.slice(0, 2)) {
      const products = await getMerchantProducts(merchant.id);
      const matchingProduct = products.find(
        (p) =>
          p.name.toLowerCase().includes(itemName.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(itemName.toLowerCase()))
      );

      if (matchingProduct) {
        const orderCount = itemOrderCount[itemName] || 0;
        const confidence = Math.min(95, 50 + orderCount * 10);

        predictions.push({
          productId: matchingProduct.id,
          merchantId: merchant.id,
          merchantName: merchant.name,
          name: matchingProduct.name,
          price: matchingProduct.price,
          image: matchingProduct.image,
          confidence,
          reason: orderCount > 3
            ? `You've ordered this ${orderCount} times`
            : orderCount > 0
            ? 'Based on your order history'
            : 'Popular item you might like',
          lastOrdered: itemLastOrdered[itemName],
          orderFrequency:
            orderCount > 5
              ? 'Very frequent'
              : orderCount > 2
              ? 'Regular'
              : 'Occasional',
        });
        break; // Only need one product per item
      }
    }
  }

  // If no predictions from history, suggest popular items
  if (predictions.length === 0) {
    const popularProducts = localProductsDB
      .filter((p) => p.rating && p.rating >= 4.5)
      .slice(0, 3);

    for (const product of popularProducts) {
      const merchant = merchantsDB.find((m) => m.id === product.merchantId);
      if (merchant) {
        predictions.push({
          productId: product.id,
          merchantId: merchant.id,
          merchantName: merchant.name,
          name: product.name,
          price: product.price,
          image: product.image,
          confidence: 40,
          reason: 'Highly rated item you might enjoy',
        });
      }
    }
  }

  return predictions;
}

// Calculate timing recommendations
function calculateTiming(
  orderHistory: OrderHistory[],
  bestTimeToOrder: string
): {
  bestTimeToOrder: string;
  nextPredictedOrder: string;
  urgency: 'low' | 'medium' | 'high';
} {
  const now = new Date();
  const lastOrder = orderHistory.length > 0
    ? new Date(orderHistory[orderHistory.length - 1].timestamp)
    : null;

  // Calculate average order frequency
  let avgDaysBetweenOrders = 3;
  if (orderHistory.length > 1) {
    const sortedOrders = [...orderHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let totalDays = 0;
    for (let i = 1; i < sortedOrders.length; i++) {
      const diff =
        new Date(sortedOrders[i].timestamp).getTime() -
        new Date(sortedOrders[i - 1].timestamp).getTime();
      totalDays += diff / (1000 * 60 * 60 * 24);
    }
    avgDaysBetweenOrders = totalDays / (sortedOrders.length - 1);
  }

  // Calculate days since last order
  const daysSinceLastOrder = lastOrder
    ? (now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  // Determine urgency
  let urgency: 'low' | 'medium' | 'high' = 'low';
  if (daysSinceLastOrder > avgDaysBetweenOrders * 1.5) {
    urgency = 'high';
  } else if (daysSinceLastOrder > avgDaysBetweenOrders) {
    urgency = 'medium';
  }

  // Calculate next predicted order
  const nextOrderDate = new Date(
    now.getTime() + (avgDaysBetweenOrders - daysSinceLastOrder) * 24 * 60 * 60 * 1000
  );

  return {
    bestTimeToOrder: bestTimeToOrder.charAt(0).toUpperCase() + bestTimeToOrder.slice(1),
    nextPredictedOrder:
      daysSinceLastOrder >= avgDaysBetweenOrders
        ? 'Today or tomorrow'
        : `In about ${Math.ceil(avgDaysBetweenOrders - daysSinceLastOrder)} days`,
    urgency,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PredictOrderRequest = await request.json();
    const { orderHistory = [], preferences } = body;

    // Step 1: Analyze patterns from order history
    const { patterns, predictedItems, bestTimeToOrder } = await analyzePatterns(orderHistory);

    // Step 2: Find matching products
    const predictions = await findPredictedProducts(predictedItems, orderHistory);

    // Step 3: Calculate timing
    const timing = calculateTiming(orderHistory, bestTimeToOrder);

    // Step 4: Build suggested cart (top 3 predictions)
    const suggestedCartItems = predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    const estimatedTotal = suggestedCartItems.reduce((sum, item) => sum + item.price, 0);
    const avgConfidence =
      suggestedCartItems.length > 0
        ? Math.round(
            suggestedCartItems.reduce((sum, item) => sum + item.confidence, 0) /
              suggestedCartItems.length
          )
        : 0;

    // Generate AI insight
    let aiInsight: string | undefined;
    if (llmEnabled() && predictions.length > 0) {
      const insightPrompt = `User patterns: ${patterns.map((p) => p.description).join('. ')}. Predictions: ${predictions.map((p) => p.name).join(', ')}. Give a brief, friendly 1-sentence insight about their shopping habits.`;

      aiInsight = (await llmChat([
        { role: 'system', content: 'You are a friendly shopping assistant providing brief insights. Be warm and helpful.' },
        { role: 'user', content: insightPrompt }
      ], { temperature: 0.7 })) || undefined;
    }

    const response: PredictOrderResponse = {
      success: true,
      agent: 'PredictiveAutoOrderingAgent',
      timestamp: new Date().toISOString(),
      predictions,
      patterns,
      suggestedCart: {
        items: suggestedCartItems,
        estimatedTotal,
        confidence: avgConfidence,
      },
      timing,
      aiInsight,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Predict Order Agent Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
