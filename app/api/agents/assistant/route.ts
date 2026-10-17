import { NextRequest, NextResponse } from 'next/server';
import { llmJSON } from '../llm';

// POST /api/agents/assistant
// Conversational concierge brain. Classifies what the user said into an intent
// and returns a spoken reply. Lets the voice assistant chat AND order, like a
// personal assistant. Falls back to keyword routing if the LLM is unavailable.

const SYSTEM_PROMPT = `You are "Loopora", a warm, witty voice shopping concierge — think Siri or Jarvis — for a
local marketplace that can find and order from nearby merchants (coffee shops, restaurants, bakeries, grocery stores).

Classify the user's message and reply in a natural, spoken style (no markdown, no emojis).
Respond with ONLY this JSON:
{
  "intent": "order" | "chat" | "stop",
  "reply": "<what you say out loud>",
  "orderQuery": "<for order intent: a concise normalized request; else empty>"
}

Rules:
- "order": the user wants to buy / order / get food, drinks, groceries, ingredients, or supplies for cooking. Recipe-shopping language such as "I need ingredients to make biryani" is an order intent. Preserve the dish and variant words (e.g. chicken/vegetarian) in orderQuery instead of rewriting it as a cooked-food order. reply = a short friendly acknowledgement (max 12 words) like "Sure — let me build that grocery basket." Set orderQuery.
- "stop": the user is ending the chat or thanking you to finish ("that's it", "that's all", "thanks, bye", "I'm done", "thank you"). reply = a warm, personable goodbye (max 14 words), e.g. "Anytime! It was lovely helping you. Talk soon!"
- "chat": anything else — questions, small talk, "what can you do". reply = a concise, helpful spoken answer (max 40 words). If asked what you can do, mention you find and order from local coffee shops, restaurants, bakeries and grocery stores by voice, including ingredient baskets for supported recipes.
Be friendly and human, like a personal assistant.`;

interface AssistantResult {
  intent?: 'order' | 'chat' | 'stop';
  reply?: string;
  orderQuery?: string;
}

const ORDER_HINT = /\b(order|buy|get me|grab|want|need|coffee|tea|breakfast|lunch|dinner|food|grocery|groceries|ingredient|ingredients|cook|cooking|recipe|prepare|make|cake|pizza|biryani|snack|hungry|eat|drink)\b/i;
const STOP_HINT = /\b(that's it|thats it|that's all|thats all|stop|done|bye|goodbye|thank you|thanks|no more|nothing else|that is all)\b/i;

function fallback(message: string): AssistantResult {
  const m = message.toLowerCase();
  if (STOP_HINT.test(m) && !ORDER_HINT.test(m)) {
    return { intent: 'stop', reply: 'Anytime! It was a pleasure helping you. Talk soon!' };
  }
  if (ORDER_HINT.test(m)) {
    const recipeShopping = /\b(ingredient|ingredients|cook|cooking|recipe|prepare|make)\b/i.test(message);
    return {
      intent: 'order',
      reply: recipeShopping ? 'Sure — let me build that grocery basket.' : 'Sure — let me find that near you.',
      orderQuery: message,
    };
  }
  return {
    intent: 'chat',
    reply: "I can find and order from local coffee shops, restaurants, bakeries and grocery stores. Just tell me what you're craving or cooking!",
  };
}

export async function POST(request: NextRequest) {
  const { message } = await request.json().catch(() => ({ message: '' }));
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ success: true, ...fallback('') });
  }

  const result = await llmJSON<AssistantResult>(SYSTEM_PROMPT, `User said: "${message}"`, { temperature: 0.6 });
  const out = result?.intent ? result : fallback(message);

  return NextResponse.json({
    success: true,
    intent: out.intent ?? 'chat',
    reply: out.reply ?? "I'm here to help you order from nearby merchants.",
    orderQuery: out.orderQuery ?? message,
  });
}
