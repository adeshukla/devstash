import 'server-only'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

export interface GroqMessage {
  role: 'system' | 'user'
  content: string
}

export interface GroqCallResult {
  content: string
  promptTokens: number
  completionTokens: number
  latencyMs: number
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
 * One Groq chat-completions call. Never logs the API key or the raw request
 * body — callers must only log this function's thrown `message`/`status`.
 */
export async function callGroq(
  apiKey: string,
  messages: GroqMessage[],
  options?: { temperature?: number; jsonMode?: boolean }
): Promise<GroqCallResult> {
  const started = Date.now()

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  const latencyMs = Date.now() - started

  if (!res.ok) {
    throw new GroqCallError(`Groq request failed with status ${res.status}`, res.status)
  }

  const data = await res.json()
  const content: string | undefined = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new GroqCallError('Groq response missing message content')
  }

  return {
    content,
    promptTokens: data?.usage?.prompt_tokens ?? 0,
    completionTokens: data?.usage?.completion_tokens ?? 0,
    latencyMs,
  }
}
