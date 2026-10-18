import { AI_SAFETY_POLICY, protectMessages, protectModelOutput, redactPII } from './guardrails';

const GOOGLE_MODEL = process.env.GOOGLE_MODEL || 'gemini-3.8-flash';
const VERTEX_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || '';
const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'global';
const VERTEX_ACCESS_TOKEN = process.env.VERTEX_ACCESS_TOKEN || '';
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

export interface VertexToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface VertexToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

// Backward-compatible type names used by existing agent routes. The model is
// still Gemini; Vertex AI is now the serving/authentication platform.
export type GeminiToolDefinition = VertexToolDefinition;
export type GeminiToolCall = VertexToolCall;

let cachedVertexToken: { token: string; expiresAt: number } | null = null;

function vertexBaseUrl(): string {
  return VERTEX_LOCATION === 'global'
    ? 'https://aiplatform.googleapis.com'
    : `https://${VERTEX_LOCATION}-aiplatform.googleapis.com`;
}

function vertexModelUrl(): string {
  return `${vertexBaseUrl()}/v1/projects/${encodeURIComponent(VERTEX_PROJECT)}/locations/${encodeURIComponent(VERTEX_LOCATION)}/publishers/google/models/${encodeURIComponent(GOOGLE_MODEL)}:generateContent`;
}

async function getVertexAccessToken(): Promise<string | null> {
  // Useful for local evaluation: populate with a short-lived token from
  // `gcloud auth print-access-token`. Cloud Run should use service identity.
  if (VERTEX_ACCESS_TOKEN) return VERTEX_ACCESS_TOKEN;
  if (!VERTEX_PROJECT) return null;

  const now = Date.now();
  if (cachedVertexToken && cachedVertexToken.expiresAt - 60_000 > now) {
    return cachedVertexToken.token;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' }, signal: controller.signal },
    );
    if (!response.ok) {
      console.error('[llm:vertex-ai-auth] metadata token request failed', response.status);
      return null;
    }
    const payload = await response.json();
    const token = typeof payload?.access_token === 'string' ? payload.access_token : '';
    const expiresIn = Number(payload?.expires_in);
    if (!token) return null;
    cachedVertexToken = {
      token,
      expiresAt: now + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3_000) * 1_000,
    };
    return token;
  } catch (error) {
    console.error('[llm:vertex-ai-auth] metadata token request error', error instanceof Error ? error.name : 'unknown');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function vertexGenerateContent(
  body: Record<string, unknown>,
  timeoutMs: number,
  label: string,
): Promise<Record<string, any> | null> {
  if (!VERTEX_PROJECT) return null;
  const token = await getVertexAccessToken();
  if (!token) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(vertexModelUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[llm:vertex-ai-${label}] request failed`, response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`[llm:vertex-ai-${label}] request error`, error instanceof Error ? error.name : 'unknown');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function vertexText(payload: Record<string, any> | null): string | null {
  const raw = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: unknown }) => typeof part.text === 'string' ? part.text : '')
    .join('');
  return typeof raw === 'string' && raw.length > 0 ? protectModelOutput(raw) : null;
}

export function llmEnabled(): boolean {
  return Boolean(VERTEX_PROJECT) || USE_AZURE || Boolean(GH_TOKEN);
}

export function llmDescriptor(): { provider: string; model: string } | null {
  if (VERTEX_PROJECT) return { provider: 'Google Vertex AI', model: GOOGLE_MODEL };
  if (USE_AZURE) return { provider: 'Azure OpenAI', model: AZURE_DEPLOYMENT! };
  if (GH_TOKEN) return { provider: 'GitHub Models', model: GH_MODEL };
  return null;
}

export function buildChatRequest(): ChatRequest | null {
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

async function vertexChat(
  messages: ChatMessage[],
  opts: { json?: boolean; timeoutMs?: number } = {},
): Promise<string | null> {
  const protectedMessages = protectMessages(messages);
  const systemInstruction = protectedMessages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
  const contents = protectedMessages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
  if (contents.length === 0) return null;

  const payload = await vertexGenerateContent({
    ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction.slice(0, 24_000) }] } } : {}),
    contents,
    ...(opts.json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
  }, opts.timeoutMs ?? 12_000, 'chat');
  return vertexText(payload);
}

export async function llmChat(
  messages: ChatMessage[],
  opts: { json?: boolean; temperature?: number; timeoutMs?: number } = {},
): Promise<string | null> {
  if (VERTEX_PROJECT) {
    return vertexChat(messages, { json: opts.json, timeoutMs: opts.timeoutMs });
  }

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

/**
 * Ask Gemini on Vertex AI to choose bounded application tools. Vertex AI uses
 * Cloud IAM/service identity for authentication; application code still owns
 * execution and all authoritative commerce state.
 */
export async function vertexToolCalls(
  system: string,
  user: string,
  tools: VertexToolDefinition[],
  opts: { reasoningEffort?: 'low' | 'medium' | 'high'; timeoutMs?: number } = {},
): Promise<VertexToolCall[] | null> {
  if (!VERTEX_PROJECT || tools.length === 0) return null;

  const allowed = new Set(tools.map((tool) => tool.name));
  const payload = await vertexGenerateContent({
    systemInstruction: {
      parts: [{ text: `${AI_SAFETY_POLICY}\n\n${system}`.slice(0, 24_000) }],
    },
    contents: [{ role: 'user', parts: [{ text: redactPII(user).slice(0, 14_000) }] }],
    tools: [{
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    }],
    toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    generationConfig: { thinkingLevel: (opts.reasoningEffort ?? 'medium').toUpperCase() },
  }, opts.timeoutMs ?? 12_000, 'tools');
  if (!payload) return null;

  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return [];

  const calls: VertexToolCall[] = [];
  for (const part of parts.slice(0, 12)) {
    const raw = part?.functionCall;
    const name = raw?.name;
    if (typeof name !== 'string' || !allowed.has(name)) continue;
    const args = raw?.args && typeof raw.args === 'object' && !Array.isArray(raw.args)
      ? raw.args as Record<string, unknown>
      : {};
    calls.push({
      id: typeof raw?.id === 'string' ? raw.id.slice(0, 120) : `tool-${calls.length + 1}`,
      name,
      arguments: args,
    });
  }
  return calls;
}

// Existing routes use model-oriented names. Keep aliases while the underlying
// transport is exclusively Vertex AI when GOOGLE_CLOUD_PROJECT is configured.
export const geminiToolCalls = vertexToolCalls;

const GEMINI_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Multimodal Gemini request served by Vertex AI. Image bytes stay in-memory in
 * Loopora and are sent only in this bounded request; they are never persisted.
 */
export async function vertexMultimodalJSON<T = Record<string, unknown>>(
  system: string,
  user: string,
  image?: { mimeType: string; data: string },
  timeoutMs = 15_000,
): Promise<T | null> {
  if (!VERTEX_PROJECT) return null;
  if (image && (!GEMINI_IMAGE_TYPES.has(image.mimeType) || image.data.length > 600_000)) return null;

  const parts: Array<Record<string, unknown>> = [{ text: redactPII(user).slice(0, 14_000) }];
  if (image) {
    parts.unshift({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const payload = await vertexGenerateContent({
    systemInstruction: { parts: [{ text: `${AI_SAFETY_POLICY}\n\n${system}`.slice(0, 24_000) }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { responseMimeType: 'application/json' },
  }, timeoutMs, 'multimodal');
  const raw = vertexText(payload);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]) as T; } catch { return null; }
  }
}

export const geminiMultimodalJSON = vertexMultimodalJSON;
