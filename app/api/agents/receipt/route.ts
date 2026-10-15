import { NextRequest, NextResponse } from 'next/server';
import { llmChat } from '../llm';

// POST /api/agents/receipt
// Receipt Agent - writes a short, friendly receipt summary for a completed order.
// Falls back to a templated summary if the LLM is unavailable.

const SYSTEM_PROMPT = `You are the Receipt Agent for an agentic commerce marketplace.
Write a warm, concise order confirmation (2-3 sentences, max ~45 words) that the app can
also read aloud. Mention the merchant, what was ordered, the total, and the loyalty points
earned. If a next reward is close, nudge the customer toward it. No markdown, no emojis, plain text.`;

interface ReceiptBody {
  merchantName?: string;
  items?: { name: string; quantity: number }[];
  total?: number;
  pointsEarned?: number;
  estimatedReady?: string;
}

function fallbackSummary(b: ReceiptBody): string {
  const itemList = (b.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(', ');
  return `Your order from ${b.merchantName ?? 'the merchant'}${
    itemList ? ` (${itemList})` : ''
  } is confirmed for $${(b.total ?? 0).toFixed(2)}. It'll be ready in about ${
    b.estimatedReady ?? 'a few minutes'
  }, and you earned ${b.pointsEarned ?? 0} loyalty points.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReceiptBody = await request.json();

    const itemList = (body.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(', ');
    const userPrompt = `Order details:
- Merchant: ${body.merchantName ?? 'Unknown'}
- Items: ${itemList || 'n/a'}
- Total: $${(body.total ?? 0).toFixed(2)}
- Loyalty points earned: ${body.pointsEarned ?? 0}
- Ready in: ${body.estimatedReady ?? 'a few minutes'}`;

    const summary =
      (await llmChat(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        { temperature: 0.6 }
      )) || fallbackSummary(body);

    return NextResponse.json({ success: true, summary: summary.trim() });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to generate receipt' }, { status: 500 });
  }
}
