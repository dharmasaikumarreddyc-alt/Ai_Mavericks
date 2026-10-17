import { protectMessages, protectModelOutput } from './guardrails';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const GOOGLE_MODEL = process.env.GOOGLE_MODEL || 'gemini-3.8-flash';
const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const AZURE_ENDPOINT_RAW = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_ENDPOINT = AZURE_ENDPOINT_RAW.endsWith('/') ? AZURE_ENDPOINT_RAW.slice(0, -1) : AZURE_ENDPOINT_RAW;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT;
const AZURE_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
const GH_BASE_URL = process.env.GITHUB_MODELS_BASE_URL || 'https://models.inference.ai.azure.com';
const GH_MODEL = process.env.GITHUB_MODELS_MODEL || 'gpt-4o';
const GH_TOKEN = process.env.GITHUB_MODELS_TOKEN;
const USE_AZURE = Boolean(AZURE_ENDPOINT && AZURE_API_KEY && AZURE_DEPLOYMENT);

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }
interface ChatRequest {
  url: string;
  headers: Record<string, string>;
  modelField?: string;
  supportsTemperature: boolean;
  provider: string;
}

export function llmEnabled(): boolean {
  return Boolean(GOOGLE_API_KEY) || USE_AZURE || Boolean(GH_TOKEN);
}

export function llmDescriptor(): { provider: string; model: string } | null {
  if (GOOGLE_API_KEY) return { provider: 'Google Gemini', model: GOOGLE_MODEL };
  if (USE_AZURE) return { provider: 'Azure OpenAI', model: AZURE_DEPLOYMENT! };
  if (GH_TOKEN) return { provider: 'GitHub Models', model: GH_MODEL };
  return null;
}

export function buildChatRequest(): ChatRequest | null {
  if (GOOGLE_API_KEY) return {
    url: `${GOOGLE_BASE_URL}/chat/completions`,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GOOGLE_API_KEY}` },
    modelField: GOOGLE_MODEL, supportsTemperature: true, provider: 'google-gemini',
  };
  if (USE_AZURE) return {
    url: `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`,
    headers: { 'Content-Type': 'application/json', 'api-key': AZURE_API_KEY! },
    supportsTemperature: false, provider: 'azure-openai',
  };
  if (GH_TOKEN) return {
    url: `${GH_BASE_URL}/chat/completions`,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GH_TOKEN}` },
    modelField: GH_MODEL, supportsTemperature: true, provider: 'github-models',
  };
  return null;
}

export async function llmChat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number; timeoutMs?: number } = {},
): Promise<string | null> {
  const req = buildChatRequest();
  if (!req) return null;
  const { json = false, temperature = 0.3, timeoutMs = 12_000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body: Record<string, unknown> = {
      messages: protectMessages(messages),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    };
    if (req.supportsTemperature) body.temperature = temperature;
    if (req.modelField) body.model = req.modelField;
    const response = await fetch(req.url, {
      method: 'POST', headers: req.headers, body: JSON.stringify(body), signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[llm:${req.provider}] request failed`, response.status);
      return null;
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? protectModelOutput(content) : null;
  } catch (error) {
    console.error(`[llm:${req.provider}] request error`, error instanceof Error ? error.name : 'unknown');
    return null;
  } finally { clearTimeout(timer); }
}

export async function llmJSON<T = Record<string, unknown>>(
  system: string,
  user: string,
  opts: { temperature?: number } = {},
): Promise<T | null> {
  const raw = await llmChat(
    [{ role: 'system', content: system }, { role: 'user', content: user }],
    { json: true, temperature: opts.temperature ?? 0.3 },
  );
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) try { return JSON.parse(match[0]) as T; } catch { /* deterministic fallback */ }
    return null;
  }
}
