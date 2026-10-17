import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, getMerchantProducts, merchantsDB, type Product } from '../data';
import {
  biryaniVariant,
  deterministicBiryaniIngredients,
  groceryMerchant,
  groceryProducts,
  isRecipeShoppingIntent,
  type BiryaniVariant,
} from '../grocery-data';
import { llmDescriptor, llmJSON, llmEnabled } from '../llm';

// POST /api/agents/inventory
// Inventory Agent - Picks the products from a merchant that best satisfy the request.
// Uses the LLM to reason over the catalog; falls back to keyword search.

const SYSTEM_PROMPT = `You are the Inventory Agent for an agentic commerce marketplace.
Given a customer's request and a single merchant's catalog, choose the items that best fulfil the request.
Pick a sensible, minimal set (usually 1-3 items) — e.g. "coffee and a vegan breakfast" -> one coffee + one vegan breakfast item.

Rules:
- Only choose from the provided product ids. Never invent products.
- Respect dietary/other constraints stated in the request.
- Order the items best-first.
- If the EXACT item requested is not available, mark it as an alternative and explain clearly.

Respond with ONLY a JSON object:
{
  "items": [{ "id": "<product-id>", "reason": "<one short sentence why it fits>", "isAlternative": true/false, "originalRequest": "<what customer asked for if this is alternative>" }],
  "exactMatchFound": true/false,
  "spoken": "<one friendly sentence. If alternatives, say something like 'I couldn't find X, but Y is a great alternative. Would you like that instead?'>"
}`;

const RECIPE_SYSTEM_PROMPT = `You are a cooking-planning assistant inside a governed grocery marketplace.
Analyze the customer's cooking request, but do NOT invent store inventory, prices, availability, offers, merchants, or medical/allergen claims.
For this prototype you only handle biryani ingredient planning.

Return ONLY JSON:
{
  "dish": "biryani",
  "variant": "chicken" | "vegetarian" | "unspecified",
  "ingredients": ["short ingredient name", "..."],
  "summary": "one concise sentence explaining the ingredient plan"
}

Use common home-cooking ingredients. Keep the ingredient list practical (maximum 12). If the customer did not choose chicken or vegetarian, use "unspecified".`;

interface LlmInventoryResult {
  items?: { id: string; reason: string; isAlternative?: boolean; originalRequest?: string }[];
  exactMatchFound?: boolean;
  spoken?: string;
}

interface AiSelectResult {
  products: Product[];
  spoken?: string;
  exactMatchFound: boolean;
  alternatives: { productId: string; originalRequest: string; reason: string }[];
}

interface RecipePlanResult {
  dish?: string;
  variant?: BiryaniVariant;
  ingredients?: string[];
  summary?: string;
}

interface RecipePlan {
  variant: BiryaniVariant;
  ingredients: string[];
  summary: string;
  usedAI: boolean;
}

async function analyzeBiryaniRecipe(query: string): Promise<RecipePlan> {
  const fallbackVariant = biryaniVariant(query);
  const fallbackIngredients = deterministicBiryaniIngredients(query);
  const fallback: RecipePlan = {
    variant: fallbackVariant,
    ingredients: fallbackIngredients,
    summary: `A practical biryani basket needs ${fallbackIngredients.join(', ')}.`,
    usedAI: false,
  };

  if (!llmEnabled()) return fallback;

  try {
    const result = await llmJSON<RecipePlanResult>(
      RECIPE_SYSTEM_PROMPT,
      `Customer cooking request: "${query}"`
    );
    const validVariant: BiryaniVariant =
      result?.variant === 'chicken' || result?.variant === 'vegetarian' || result?.variant === 'unspecified'
        ? result.variant
        : fallbackVariant;
    const ingredients = Array.isArray(result?.ingredients)
      ? result.ingredients
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim().slice(0, 80))
          .slice(0, 12)
      : [];

    return {
      variant: validVariant,
      ingredients: ingredients.length > 0 ? ingredients : fallbackIngredients,
      summary:
        typeof result?.summary === 'string' && result.summary.trim()
          ? result.summary.trim().slice(0, 300)
          : fallback.summary,
      usedAI: true,
    };
  } catch {
    // Recipe reasoning is helpful but not authoritative. If Gemini is unavailable,
    // use the explicit deterministic biryani profile and keep checkout functional.
    return fallback;
  }
}

function productById(id: string): Product {
  const product = groceryProducts.find((item) => item.id === id);
  if (!product) throw new Error(`Missing bounded grocery product ${id}`);
  return product;
}

async function recipeSelectProducts(query: string): Promise<AiSelectResult & { usedAI: boolean; ingredients: string[]; summary: string }> {
  const plan = await analyzeBiryaniRecipe(query);
  const variant = plan.variant === 'unspecified' ? biryaniVariant(query) : plan.variant;
  const freshId =
    variant === 'chicken'
      ? 'fm-biryani-chicken'
      : variant === 'vegetarian'
        ? 'fm-biryani-veg'
        : 'fm-biryani-fresh-base';

  const pantry = productById('fm-biryani-pantry');
  const fresh = productById(freshId);
  const ingredientsText = plan.ingredients.slice(0, 10).join(', ');
  const proteinNote =
    variant === 'unspecified'
      ? ' I kept protein optional because the customer did not choose chicken or vegetarian.'
      : '';

  return {
    products: [
      { ...pantry, aiReason: 'Covers the rice, spice and ghee portion of the analyzed biryani plan.' },
      { ...fresh, aiReason: 'Covers the fresh ingredients for the selected biryani variant.' },
    ],
    spoken: `${plan.summary} I mapped ${ingredientsText} to two items actually listed at ${groceryMerchant.name}.${proteinNote} Prices and availability come from the catalog, not the model.`,
    exactMatchFound: true,
    alternatives: [],
    usedAI: plan.usedAI,
    ingredients: plan.ingredients,
    summary: plan.summary,
  };
}

async function aiSelectProducts(
  merchantId: string,
  merchantName: string,
  query: string,
  catalog: Product[]
): Promise<AiSelectResult | null> {
  if (catalog.length === 0) return null;

  const context = catalog
    .map(
      (p) =>
        `- id: ${p.id} | ${p.name} | ${p.category} | $${p.price} | tags: ${p.tags.join(', ')} | ${p.description}`
    )
    .join('\n');

  const result = await llmJSON<LlmInventoryResult>(
    SYSTEM_PROMPT,
    `Customer request: "${query}"\nMerchant: ${merchantName}\n\nCatalog:\n${context}`
  );

  if (!result?.items?.length) return null;

  const products: Product[] = [];
  const alternatives: { productId: string; originalRequest: string; reason: string }[] = [];

  for (const item of result.items) {
    const product = catalog.find((p) => p.id === item.id);
    if (product && !products.find((x) => x.id === product.id)) {
      products.push({ ...product, aiReason: item.reason });
      if (item.isAlternative && item.originalRequest) {
        alternatives.push({
          productId: product.id,
          originalRequest: item.originalRequest,
          reason: item.reason,
        });
      }
    }
  }
  if (products.length === 0) return null;

  return {
    products,
    spoken: result.spoken,
    exactMatchFound: result.exactMatchFound ?? true,
    alternatives,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, query } = body;

    if (!merchantId || typeof merchantId !== 'string') {
      return NextResponse.json({ success: false, error: 'Merchant ID is required' }, { status: 400 });
    }

    if (merchantId === groceryMerchant.id) {
      if (!query || typeof query !== 'string' || !isRecipeShoppingIntent(query)) {
        return NextResponse.json({ success: false, error: 'This grocery prototype currently supports biryani ingredient missions.' }, { status: 422 });
      }

      const recipe = await recipeSelectProducts(query);
      const configuredModel = llmDescriptor();
      return NextResponse.json({
        success: true,
        agent: 'InventoryAgent',
        mode: recipe.usedAI ? 'llm-recipe-plan' : llmEnabled() ? 'llm-fallback' : 'deterministic-recipe-plan',
        merchantId,
        merchantName: groceryMerchant.name,
        query,
        timestamp: new Date().toISOString(),
        results: {
          products: recipe.products,
          count: recipe.products.length,
          message: `Built a grounded biryani ingredient basket from ${groceryMerchant.name}.`,
          spoken: recipe.spoken,
          exactMatchFound: true,
          hasAlternatives: false,
          alternatives: [],
          alternativeMessage: '',
          recipePlan: {
            dish: 'biryani',
            ingredients: recipe.ingredients,
            summary: recipe.summary,
          },
          provenance: {
            selectionMode: recipe.usedAI ? 'model' : 'deterministic-fallback',
            provider: recipe.usedAI ? configuredModel?.provider ?? null : null,
            model: recipe.usedAI ? configuredModel?.model ?? null : null,
            evidenceSource: recipe.usedAI
              ? 'Gemini recipe planning mapped to bounded synthetic grocery catalog'
              : 'deterministic biryani profile mapped to bounded synthetic grocery catalog',
            piiControls: ['email pattern', 'phone pattern', 'payment-number pattern'],
          },
        },
      });
    }

    const merchant = merchantsDB.find((m) => m.id === merchantId);
    if (!merchant) {
      return NextResponse.json({ success: false, error: 'Merchant not found' }, { status: 404 });
    }

    // Fetch products from the bounded local catalog.
    const allMerchantProducts = await getMerchantProducts(merchantId);

    // Try the real AI agent first; fall back to keyword matching.
    const ai = await aiSelectProducts(merchantId, merchant.name, query || '', allMerchantProducts);
    const matchingProducts = await searchProducts(merchantId, query || '');
    const catalogAlternatives =
      !ai && matchingProducts.length === 0 ? allMerchantProducts.slice(0, 3) : [];
    const products = ai?.products ?? (matchingProducts.length > 0 ? matchingProducts : catalogAlternatives);
    const usedAI = Boolean(ai);
    const configuredModel = llmDescriptor();

    const alternatives =
      ai?.alternatives ??
      catalogAlternatives.map((product) => ({
        productId: product.id,
        originalRequest: query || 'your request',
        reason: `Available at ${merchant.name}`,
      }));
    const hasAlternatives = alternatives.length > 0;
    const exactMatchFound = ai?.exactMatchFound ?? catalogAlternatives.length === 0;

    // Build appropriate message
    let message = '';
    let alternativeMessage = '';
    if (catalogAlternatives.length > 0) {
      const names = catalogAlternatives.map((product) => product.name).join(', ');
      message = `No exact match found at ${merchant.name}`;
      alternativeMessage = `I couldn't find an exact match for "${query}" at ${merchant.name}. Here are some items actually available there: ${names}. Would you like one of these instead?`;
    } else if (products.length === 0) {
      message = `No matching products found at ${merchant.name}`;
    } else if (ai && hasAlternatives && !exactMatchFound) {
      const altItems = alternatives.map(a => a.originalRequest).join(', ');
      message = `"${altItems}" is not available at ${merchant.name}`;
      alternativeMessage = `We found a similar alternative: ${products.map(p => p.name).join(', ')}. Would you like this instead?`;
    } else {
      message = `Found ${products.length} product${products.length > 1 ? 's' : ''} at ${merchant.name}`;
    }

    const response = {
      success: true,
      agent: 'InventoryAgent',
      mode: usedAI ? 'llm' : llmEnabled() ? 'llm-fallback' : 'keyword',
      merchantId,
      merchantName: merchant.name,
      query: query || '',
      timestamp: new Date().toISOString(),
      results: {
        products,
        count: products.length,
        message,
        spoken: catalogAlternatives.length > 0 ? alternativeMessage : ai?.spoken,
        exactMatchFound,
        hasAlternatives,
        alternatives,
        alternativeMessage,
        provenance: {
          selectionMode: usedAI ? 'model' : 'deterministic-fallback',
          provider: usedAI ? configuredModel?.provider ?? null : null,
          model: usedAI ? configuredModel?.model ?? null : null,
          evidenceSource: 'bounded synthetic product catalog',
          piiControls: ['email pattern', 'phone pattern', 'payment-number pattern'],
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Inventory Agent Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
