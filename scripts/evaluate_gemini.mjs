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
      } else if (payload.mode === 'gemini-multimodal') {
        modelCases += 1;
      } else {
        ok = false;
        reasons.push('live Gemini was not used');
      }

      if (test.expectAgentic !== false && test.scenario !== 'model-outage') {
        const hasAgentTrace = (payload.trace || []).some((step) => step.id === 'agent-tools');
        const hasAgentContract = payload.agent?.architecture && payload.agent?.chainOfThoughtExposed === false;
        if (!hasAgentTrace || !hasAgentContract) {
          ok = false;
          reasons.push('agentic tool-planning evidence missing');
        } else {
          agenticCases += 1;
        }
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
        const repaired = (payload.trace || []).some((step) => step.id === 'validator-2' && step.status === 'passed');
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
    tools: payload.agent?.requestedTools || [],
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
  agenticCases,
  validatorPasses,
  repairCases,
  injectionBlocks,
  fallbackCases,
  evidenceDimensions: [
    'live Gemini use',
    'custom tool-planning trace',
    'grounded catalog output',
    'deterministic budget/policy validation',
    'validator-to-repair loop',
    'prompt-injection blocking',
    'model-outage fallback',
    'human-confirmation governance',
  ],
  note: 'A valid GOOGLE_API_KEY is required for non-fallback cases. This harness refuses to count deterministic fallback as live Gemini quality and reports measured behavior only.',
  results,
}, null, 2));

if (passed !== cases.length) process.exitCode = 1;
