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
  // llama-3.1-8b-instant was deprecated by Groq on 2026-06-17; this is their
  // own documented migration target (console.groq.com/docs/deprecations).
  model: 'openai/gpt-oss-20b',
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

export interface LlmCallOptions {
  temperature?: number
  jsonMode?: boolean
  /** Per-call model override — falls back to the provider's default model. */
  modelOverride?: string
  /** Per-call completion cap. Unset means the provider default. */
  maxTokens?: number
  /**
   * gpt-oss models are REASONING models: hidden reasoning tokens are billed
   * against the same completion budget as the visible answer. At default
   * effort a mechanical rewrite can spend its entire ~2048-token default cap
   * thinking and return a truncated fragment. 'low' collapses reasoning to
   * near zero for tasks that need transformation, not deliberation.
   */
  reasoningEffort?: 'low' | 'medium' | 'high'
}

export interface GroqCallResult {
  content: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
  provider: string
  /** 'stop' = the model finished; 'length' = it hit the token cap mid-output. */
  finishReason: string
}

export class GroqCallError extends Error {
  constructor(
    message: string,
    public status?: number,
    /** For 429s: how long the provider asked us to wait, in ms. */
    public retryAfterMs?: number
  ) {
    super(message)
    this.name = 'GroqCallError'
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * One chat-completions call against a specific provider. Never logs the API
 * key or the raw request body — callers must only log this function's
 * thrown `message`/`status`.
 */
async function callProvider(
  config: ProviderConfig,
  apiKey: string,
  messages: GroqMessage[],
  options?: LlmCallOptions
): Promise<GroqCallResult> {
  const started = Date.now()

  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // A caller can request a bigger model for one step without changing the
      // provider default — the HTML page builder needs far more capability and
      // output room than the short text steps do. Only honoured for Groq:
      // model IDs aren't portable, so passing a Groq ID to the Cerebras
      // fallback would turn a graceful degrade into a hard 400.
      model:
        config.name === 'groq' && options?.modelOverride ? options.modelOverride : config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options?.reasoningEffort ? { reasoning_effort: options.reasoningEffort } : {}),
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  const latencyMs = Date.now() - started

  if (!res.ok) {
    // 429 is by far the most common failure on the free tier: one full pipeline
    // run spends ~6k of the 8k-per-minute budget, so two runs close together —
    // or two visitors at once — reliably trip it. Surface it as its own status
    // so callers can wait and retry instead of failing the whole run, and carry
    // the provider's own retry hint when it gives one.
    if (res.status === 429) {
      const retryAfterHeader = res.headers.get('retry-after')
      let retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0
      if (!retryAfterMs) {
        // Groq puts "Please try again in 7.26s" in the error body when it
        // doesn't send a retry-after header.
        const body = await res.text().catch(() => '')
        const m = body.match(/try again in ([\d.]+)s/i)
        if (m) retryAfterMs = Math.ceil(parseFloat(m[1]) * 1000)
      }
      throw new GroqCallError(
        `${config.name} rate limited`,
        429,
        Math.min(retryAfterMs || 5000, 20_000)
      )
    }
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
    finishReason: data?.choices?.[0]?.finish_reason ?? 'unknown',
  }
}

/**
 * callProvider plus a bounded wait-and-retry on 429 only.
 *
 * The per-minute token budget refills continuously, so a rate limit here is
 * genuinely transient — the provider usually tells us it will clear in a few
 * seconds. Retrying that is the difference between "AI pipeline failed to
 * complete" and a run that just takes a moment longer. Nothing else is
 * retried: a 400 or 401 will fail identically no matter how long we wait.
 */
async function callProviderWithRetry(
  config: ProviderConfig,
  apiKey: string,
  messages: GroqMessage[],
  options?: LlmCallOptions,
  maxRetries = 2
): Promise<GroqCallResult> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop -- sequential backoff is the point
      return await callProvider(config, apiKey, messages, options)
    } catch (err) {
      lastErr = err
      const is429 = err instanceof GroqCallError && err.status === 429
      if (!is429 || attempt === maxRetries) throw err
      const waitMs = (err as GroqCallError).retryAfterMs ?? 5000
      console.warn(
        `[lib/ai/groq] ${config.name} rate limited, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`
      )
      // eslint-disable-next-line no-await-in-loop -- sequential backoff is the point
      await sleep(waitMs)
    }
  }
  throw lastErr
}

/**
 * BYOK path — visitors are only ever asked for a Groq key, so this always
 * targets Groq directly with the key they supplied. No fallback: it's their
 * key, their call.
 */
export async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  options?: LlmCallOptions
): Promise<GroqCallResult> {
  return callProviderWithRetry(GROQ, apiKey, messages, options)
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
  options?: LlmCallOptions
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
      return await callProviderWithRetry(
        config,
        process.env[config.apiKeyEnv] as string,
        messages,
        options
      )
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
