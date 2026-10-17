const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  return { response, payload };
}

function assert(condition, message, details = undefined) {
  if (!condition) {
    const error = new Error(message);
    error.details = details;
    throw error;
  }
}

const results = [];

async function runCase(id, fn) {
  try {
    const evidence = await fn();
    results.push({ id, ok: true, evidence });
  } catch (error) {
    results.push({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      details: error?.details,
    });
  }
}

await runCase('smart-cart-enforces-merchant-cap', async () => {
  const { response, payload } = await post('/api/agents/smart-cart', {
    query: 'Find coffee and cake',
    optimizeFor: 'balanced',
    maxMerchants: 1,
  });

  assert(response.ok, 'smart-cart request failed', payload);
  assert(payload.constraints?.requestedMaxMerchants === 1, 'requested merchant cap not echoed correctly', payload.constraints);
  assert(payload.constraints?.merchantCapSatisfied === true, 'merchant cap reported as unsatisfied', payload.constraints);
  assert(payload.summary?.totalMerchants <= 1, 'cart uses more merchants than requested', payload.summary);
  assert(payload.execution?.merchantCapEnforced === true, 'merchant-cap enforcement metadata missing', payload.execution);

  return {
    totalMerchants: payload.summary?.totalMerchants,
    unmatchedItems: payload.unmatchedItems || [],
    parser: payload.execution?.intentParser,
  };
});

await runCase('smart-cart-applies-global-optimization', async () => {
  const { response, payload } = await post('/api/agents/smart-cart', {
    query: 'Find coffee',
    optimizeFor: 'price',
    maxMerchants: 3,
  });

  assert(response.ok, 'smart-cart request failed', payload);
  assert(payload.constraints?.optimizationApplied === 'price', 'global price optimization was not applied', payload.constraints);
  assert(payload.summary?.optimizationStrategy === 'price', 'summary does not report the applied optimization', payload.summary);
  assert(payload.execution?.normalizedScoring === true, 'normalized-scoring evidence missing', payload.execution);

  return {
    optimizationApplied: payload.constraints?.optimizationApplied,
    selected: (payload.cart || []).map((item) => ({ name: item.name, price: item.price, merchant: item.merchantName })),
  };
});

await runCase('budget-shop-never-exceeds-total-budget', async () => {
  const budget = 20;
  const { response, payload } = await post('/api/agents/budget-shop', {
    budget,
    items: ['coffee', 'cake', 'pastry'],
    priorities: ['coffee'],
    flexibility: 'very_flexible',
  });

  assert(response.ok, 'budget-shop request failed', payload);
  assert(payload.currency === 'USD', 'budget-shop currency must match the synthetic USD catalog', payload.currency);
  assert(payload.budget?.allocated <= budget, 'selected basket exceeded total budget', payload.budget);
  assert(payload.budget?.remaining >= 0, 'remaining budget became negative', payload.budget);
  assert(payload.summary?.withinBudget === true, 'within-budget guard failed', payload.summary);
  assert(payload.execution?.totalBudgetGuardEnforced === true, 'hard budget guard metadata missing', payload.execution);

  const recomputed = (payload.selectedProducts || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  assert(recomputed <= budget + 1e-9, 'recomputed product total exceeded budget', { recomputed, budget });

  return {
    currency: payload.currency,
    spent: payload.budget?.allocated,
    remaining: payload.budget?.remaining,
    unmatchedItems: payload.unmatchedItems || [],
    planner: payload.execution?.allocationPlanner,
  };
});

await runCase('invalid-commerce-constraints-fail-closed', async () => {
  const smart = await post('/api/agents/smart-cart', {
    query: 'coffee',
    optimizeFor: 'price',
    maxMerchants: 0,
  });
  assert(smart.response.status === 400, 'invalid smart-cart merchant cap was accepted', smart.payload);

  const budget = await post('/api/agents/budget-shop', {
    budget: -10,
    items: ['coffee'],
  });
  assert(budget.response.status === 400, 'invalid negative budget was accepted', budget.payload);

  return { smartCartStatus: smart.response.status, budgetShopStatus: budget.response.status };
});

const passed = results.filter((result) => result.ok).length;
const report = {
  total: results.length,
  passed,
  passRatePct: Number((passed / results.length * 100).toFixed(1)),
  evidenceDimensions: [
    'merchant-cap enforcement',
    'global optimization propagation',
    'normalized smart-cart scoring contract',
    'USD catalog consistency',
    'hard total-budget enforcement',
    'fail-closed invalid constraints',
  ],
  note: 'These checks test deterministic commerce invariants. They do not claim live Gemini quality; run npm run eval:gemini separately with a valid model credential.',
  results,
};

console.log(JSON.stringify(report, null, 2));
if (passed !== results.length) process.exitCode = 1;
