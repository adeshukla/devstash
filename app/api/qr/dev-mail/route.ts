import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Test helper: the last email "sent" to an @example.test address. Does not exist in production. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') return new NextResponse('Not found', { status: 404 })
  const to = new URL(request.url).searchParams.get('to')?.toLowerCase() ?? ''
  const g = globalThis as unknown as { __qrMail?: Record<string, string> }
  const text = /@example\.test$/.test(to) ? g.__qrMail?.[to] : undefined
  return NextResponse.json({ text: text ?? null }, { headers: { 'cache-control': 'no-store' } })
}
