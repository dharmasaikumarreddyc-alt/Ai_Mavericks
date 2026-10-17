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
  } else {
    if (!response.ok || payload.success !== true) {
      ok = false;
      reasons.push('request failed');
    }
    if (payload.success) {
      if (test.scenario === 'model-outage') {
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
      if (!payload.totals?.withinBudget) {
        ok = false;
        reasons.push('budget validation failed');
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
  results.push({ id: test.id, ok, mode: payload.mode || null, reasons });
}

console.log(JSON.stringify({
  total: cases.length,
  passed,
  passRatePct: Number((passed / cases.length * 100).toFixed(1)),
  liveGeminiCases: modelCases,
  note: 'A valid GOOGLE_API_KEY is required for non-fallback cases. This harness refuses to count deterministic fallback as live Gemini quality.',
  results,
}, null, 2));

if (passed !== cases.length) process.exitCode = 1;
