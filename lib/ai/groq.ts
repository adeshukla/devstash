import 'server-only'

interface ProviderConfig {
  name: string
  url: string
  model: string
  apiKeyEnv: string
}

const GROQ: ProviderConfig = {
  name: 'groq',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.1-8b-instant',
  apiKeyEnv: 'GROQ_API_KEY',
}

const CEREBRAS: ProviderConfig = {
  name: 'cerebras',
  url: 'https://api.cerebras.ai/v1/chat/completions',
  model: 'llama-3.3-70b',
  apiKeyEnv: 'CEREBRAS_API_KEY',
}

// Order = priority. Free-tier requests try Groq first, then fall through to
// Cerebras if Groq fails for any reason (rate limit, outage, bad key).
const FALLBACK_CHAIN: ProviderConfig[] = [GROQ, CEREBRAS]

export interface GroqMessage {
  role: 'system' | 'user'
  content: string
}

export interface GroqCallResult {
  content: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
  provider: string
}

export class GroqCallError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'GroqCallError'
  }
}

/**
 * One chat-completions call against a specific provider. Never logs the API
 * key or the raw request body — callers must only log this function's
 * thrown `message`/`status`.
 */
async function callProvider(
  config: ProviderConfig,
  apiKey: string,
  messages: GroqMessage[],
  options?: { temperature?: number; jsonMode?: boolean }
): Promise<GroqCallResult> {
  const started = Date.now()

  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  const latencyMs = Date.now() - started

  if (!res.ok) {
    throw new GroqCallError(`${config.name} request failed with status ${res.status}`, res.status)
  }

  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new GroqCallError(`${config.name} response missing message content`)
  }

  return {
    content,
    promptTokens: data?.usage?.prompt_tokens ?? 0,
    completionTokens: data?.usage?.completion_tokens ?? 0,
    latencyMs,
    provider: config.name,
  }
}

/**
 * BYOK path — visitors are only ever asked for a Groq key, so this always
 * targets Groq directly with the key they supplied. No fallback: it's their
 * key, their call.
 */
export async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  options?: { temperature?: number; jsonMode?: boolean }
): Promise<GroqCallResult> {
  return callProvider(GROQ, apiKey, messages, options)
}

/** Whether at least one provider in the fallback chain has a server-side key configured. */
export function hasAnyProviderConfigured(): boolean {
  return FALLBACK_CHAIN.some((c) => Boolean(process.env[c.apiKeyEnv]))
}

/**
 * Free-tier path — tries each configured provider's own server-side key in
 * order. Any failure (rate limit, outage, bad key) advances to the next
 * configured provider; only throws once every configured provider has failed.
 */
export async function callWithFallback(
  messages: GroqMessage[],
  options?: { temperature?: number; jsonMode?: boolean }
): Promise<GroqCallResult> {
  const configured = FALLBACK_CHAIN.filter((c) => process.env[c.apiKeyEnv])
  if (configured.length === 0) {
    throw new GroqCallError('No LLM provider is configured.')
  }

  let lastErr: unknown
  for (let i = 0; i < configured.length; i++) {
    const config = configured[i]
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential fallback is the point
      return await callProvider(config, process.env[config.apiKeyEnv] as string, messages, options)
    } catch (err) {
      lastErr = err
      const isLast = i === configured.length - 1
      if (isLast) throw err
      console.warn(
        `[lib/ai/groq] ${config.name} failed, falling back to next provider:`,
        err instanceof Error ? err.message : 'unknown'
      )
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new GroqCallError('All configured LLM providers failed.')
}
