import { readFile } from 'node:fs/promises';

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const cases = JSON.parse(await readFile(new URL('../evidence/gemini_cases.json', import.meta.url), 'utf8'));

function containsExpectedTag(payload, expectedTags) {
  if (!expectedTags?.length) return true;
  const haystack = (payload.basket || [])
    .flatMap((item) => [item.name, item.description, ...(item.dietaryTags || []), ...(item.evidence || [])])
    .join(' ')
    .toLowerCase();
  return expectedTags.some((tag) => haystack.includes(String(tag).toLowerCase()));
}

function normalizeToolNames(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === 'string' && item.length > 0))];
}

function traceStep(payload, id) {
  return (payload.trace || []).find((step) => step?.id === id) || null;
}

let passed = 0;
let modelCases = 0;
let agenticCases = 0;
let validatorPasses = 0;
let repairCases = 0;
let injectionBlocks = 0;
let fallbackCases = 0;
const results = [];

for (const test of cases) {
  const response = await fetch(`${baseUrl}/api/agents/retail-copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      request: test.request,
      budget: test.budget,
      dietary: test.dietary,
      scenario: test.scenario || 'normal',
    }),
  });
  const payload = await response.json();

  let ok = true;
  const reasons = [];
  const requestedTools = normalizeToolNames(payload.agent?.requestedTools);
  const expectedTools = normalizeToolNames(test.expectedTools);
  const missingExpectedTools = expectedTools.filter((name) => !requestedTools.includes(name));
  let toolPlanningVerified = false;

  if (test.expectedBlocked) {
    ok = response.status === 400 && payload.blocked === true;
    if (!ok) reasons.push('expected pre-model block');
    else injectionBlocks += 1;
  } else {
    if (!response.ok || payload.success !== true) {
      ok = false;
      reasons.push('request failed');
    }
    if (payload.success) {
      if (test.scenario === 'model-outage') {
        fallbackCases += 1;
        if (payload.mode !== 'deterministic-fallback') {
          ok = false;
          reasons.push('fallback mode not used');
        }
      } else if (payload.mode === 'gemini-multimodal' && payload.model?.provider === 'Google Gemini') {
        modelCases += 1;
      } else {
        ok = false;
        reasons.push('verified Google Gemini mode was not used');
      }

      if (test.expectAgentic !== false && test.scenario !== 'model-outage') {
        const agentTrace = traceStep(payload, 'agent-tools');
        const groundingTrace = traceStep(payload, 'grounding');
        const hasAgentContract = typeof payload.agent?.architecture === 'string'
          && payload.agent.architecture.length > 0
          && payload.agent?.chainOfThoughtExposed === false;
        const hasFunctionCallEvidence = payload.agent?.functionCalling === true
          && requestedTools.length > 0
          && agentTrace?.status === 'passed';
        const hasApplicationGrounding = groundingTrace?.status === 'passed';

        if (!hasAgentContract) {
          ok = false;
          reasons.push('agent contract missing');
        }
        if (!hasFunctionCallEvidence) {
          ok = false;
          reasons.push('bounded Gemini function-call request evidence missing');
        }
        if (!hasApplicationGrounding) {
          ok = false;
          reasons.push('application grounding trace missing');
        }
        if (missingExpectedTools.length > 0) {
          ok = false;
          reasons.push(`expected Gemini tool request missing: ${missingExpectedTools.join(', ')}`);
        }

        toolPlanningVerified = hasAgentContract
          && hasFunctionCallEvidence
          && hasApplicationGrounding
          && missingExpectedTools.length === 0;
        if (toolPlanningVerified) agenticCases += 1;
      }

      if (!payload.totals?.withinBudget) {
        ok = false;
        reasons.push('budget validation failed');
      }
      if (payload.agent?.validatorPassed === true) validatorPasses += 1;

      if (test.expectedRepair) {
        repairCases += 1;
        if ((payload.agent?.repairAttempts || 0) < 1) {
          ok = false;
          reasons.push('expected validator/repair loop did not run');
        }
        const repairTrace = traceStep(payload, 'repair-plan');
        const geminiRequestedRepair = repairTrace?.status === 'passed'
          && typeof repairTrace?.detail === 'string'
          && repairTrace.detail.includes('Gemini requested a bounded substitution');
        if (!geminiRequestedRepair) {
          ok = false;
          reasons.push('Gemini substitution-tool request was not verified');
        }
        const repaired = traceStep(payload, 'validator-2')?.status === 'passed';
        if (!repaired) {
          ok = false;
          reasons.push('repaired plan did not pass deterministic validation');
        }
      }

      if (!payload.governance?.customerConfirmationRequired || payload.governance?.autonomousChanges) {
        ok = false;
        reasons.push('governance contract failed');
      }
      if (!containsExpectedTag(payload, test.expectedAnyTags)) {
        ok = false;
        reasons.push('expected intent signal absent from grounded basket');
      }
    }
  }

  if (ok) passed += 1;
  results.push({
    id: test.id,
    ok,
    mode: payload.mode || null,
    modelProvider: payload.model?.provider || null,
    requestedTools,
    expectedTools,
    toolPlanningVerified,
    validatorPassed: payload.agent?.validatorPassed ?? null,
    repairAttempts: payload.agent?.repairAttempts ?? 0,
    reasons,
  });
}

console.log(JSON.stringify({
  total: cases.length,
  passed,
  passRatePct: Number((passed / cases.length * 100).toFixed(1)),
  liveGeminiCases: modelCases,
  verifiedToolPlanningCases: agenticCases,
  validatorPasses,
  repairCases,
  injectionBlocks,
  fallbackCases,
  evidenceDimensions: [
    'verified Google Gemini provider use',
    'bounded Gemini function-call request evidence',
    'application catalog-grounding trace',
    'deterministic budget/policy validation',
    'verified Gemini substitution request + validator-to-repair loop',
    'prompt-injection blocking',
    'model-outage fallback',
    'human-confirmation governance',
  ],
  note: 'A valid GOOGLE_API_KEY is required for non-fallback cases. This harness refuses to count deterministic fallback as live Gemini quality, requires actual function-call requests for agentic cases, and reports only evidence present in the runtime response.',
  results,
}, null, 2));

if (passed !== cases.length) process.exitCode = 1;
