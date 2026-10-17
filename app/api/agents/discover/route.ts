import { NextRequest, NextResponse } from 'next/server';
import { searchMerchants, merchantsDB, type Merchant } from '../data';
import { biryaniVariant, groceryMerchant, isRecipeShoppingIntent } from '../grocery-data';
import { llmDescriptor, llmJSON, llmEnabled } from '../llm';

// POST /api/agents/discover
// Merchant Discovery Agent - Finds & ranks relevant merchants for a natural-language request.
// Uses the LLM to reason over the registered merchant list; falls back to keyword search.

const SYSTEM_PROMPT = `You are the Merchant Discovery Agent for an agentic commerce marketplace.
The customer speaks in natural language (e.g. "find me a local coffee shop with vegan breakfast and order ahead").
You are given a list of registered local merchants. Pick the ones that genuinely match the request and rank them best-first.

Rules:
- Only choose from the provided merchant ids. Never invent merchants.
- Prefer merchants whose type/categories/offers match the intent AND that are closer / higher rated.
- Respect dietary or other constraints (vegan, healthy, etc.) when stated.
- If the request is too vague to choose well, set a short "clarifyingQuestion".

Respond with ONLY a JSON object:
{
  "matches": [{ "id": "<merchant-id>", "reason": "<one short sentence why it fits>" }],
  "spoken": "<one friendly sentence summarizing the top pick, suitable to read aloud>",
  "clarifyingQuestion": "<a short question, or empty string if none needed>"
}`;

interface LlmDiscoverResult {
  matches?: { id: string; reason: string }[];
  spoken?: string;
  clarifyingQuestion?: string;
}

// Parse the leading number out of a distance string like "0.8 mi".
function distanceOf(m: Merchant): number {
  const n = parseFloat(m.distance);
  return Number.isFinite(n) ? n : 99;
}

function buildMerchantContext(list: Merchant[]): string {
  return list
    .map(
      (m) =>
        `- id: ${m.id} | ${m.name} (${m.type}) | categories: ${m.category.join(', ')} | rating: ${m.rating} | distance: ${m.distance} | offers: ${m.offers.join('; ')}`
    )
    .join('\n');
}

async function aiDiscover(
  query: string,
  list: Merchant[]
): Promise<{
  merchants: Merchant[];
  spoken?: string;
  clarifyingQuestion?: string;
} | null> {
  if (list.length === 0) return null;
  const result = await llmJSON<LlmDiscoverResult>(
    SYSTEM_PROMPT,
    `Customer request: "${query}"\n\nRegistered merchants (already filtered to within the customer's radius):\n${buildMerchantContext(list)}`
  );

  if (!result?.matches?.length) return null;

  // Map AI matches back to real merchant records, preserving AI order, attaching the reason.
  const merchants: Merchant[] = [];
  for (const match of result.matches) {
    const merchant = merchantsDB.find((m) => m.id === match.id && m.isOpen);
    if (merchant && !merchants.find((x) => x.id === merchant.id)) {
      merchants.push({ ...merchant, aiReason: match.reason } as Merchant & { aiReason: string });
    }
  }
  if (merchants.length === 0) return null;

  return {
    merchants,
    spoken: result.spoken,
    clarifyingQuestion: result.clarifyingQuestion || undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxDistance } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    // Radius filter — only consider open merchants within the requested distance.
    const radius = typeof maxDistance === 'number' && maxDistance > 0 ? maxDistance : 99;

    // Recipe-shopping intent is deliberately separated from restaurant intent.
    // "Order biryani" still searches restaurants; "ingredients to make biryani"
    // routes to the bounded grocery catalog so the agent cannot confuse a cooked
    // dish with a shopping list.
    if (isRecipeShoppingIntent(query)) {
      const inRadius = groceryMerchant.isOpen && distanceOf(groceryMerchant) <= radius;
      const merchant = {
        ...groceryMerchant,
        aiReason: 'Best bounded grocery match for a biryani ingredient basket.',
      } as Merchant & { aiReason: string };
      const configuredModel = llmDescriptor();
      const variant = biryaniVariant(query);
      return NextResponse.json({
        success: true,
        agent: 'MerchantDiscoveryAgent',
        mode: 'recipe-intent',
        query,
        timestamp: new Date().toISOString(),
        results: {
          merchants: inRadius ? [merchant] : [],
          count: inRadius ? 1 : 0,
          message: inRadius
            ? 'Found a grocery merchant with a bounded biryani ingredient catalog.'
            : 'No supported grocery merchant is within the selected radius.',
          spoken: inRadius
            ? `${groceryMerchant.name} is the best match for the ingredient mission: ${groceryMerchant.rating} stars, ${groceryMerchant.distance} away, with a bounded biryani grocery catalog.`
            : undefined,
          clarifyingQuestion:
            inRadius && variant === 'unspecified'
              ? 'Would you like ingredients for chicken biryani or vegetarian biryani?'
              : undefined,
          provenance: {
            selectionMode: 'deterministic-fallback',
            provider: configuredModel?.provider ?? null,
            model: configuredModel?.model ?? null,
            evidenceSource: 'bounded synthetic grocery merchant catalog',
          },
        },
      });
    }

    const withinRadius = merchantsDB.filter((m) => m.isOpen && distanceOf(m) <= radius);

    // Try the real AI agent first; fall back to keyword matching if it's unavailable.
    const ai = await aiDiscover(query, withinRadius);
    const fallbackMerchants = await searchMerchants(query);
    const merchants =
      ai?.merchants ?? fallbackMerchants.filter((m) => distanceOf(m) <= radius);
    const usedAI = Boolean(ai);
    const configuredModel = llmDescriptor();

    const response = {
      success: true,
      agent: 'MerchantDiscoveryAgent',
      mode: usedAI ? 'llm' : llmEnabled() ? 'llm-fallback' : 'keyword',
      query,
      timestamp: new Date().toISOString(),
      results: {
        merchants,
        count: merchants.length,
        message:
          merchants.length > 0
            ? `Found ${merchants.length} merchant${merchants.length > 1 ? 's' : ''} matching your request`
            : 'No merchants found for your query. Try broadening your search.',
        spoken: ai?.spoken,
        clarifyingQuestion: ai?.clarifyingQuestion,
        provenance: {
          selectionMode: usedAI ? 'model' : 'deterministic-fallback',
          provider: usedAI ? configuredModel?.provider ?? null : null,
          model: usedAI ? configuredModel?.model ?? null : null,
          evidenceSource: 'bounded synthetic merchant catalog',
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Merchant Discovery Agent Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
