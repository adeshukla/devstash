// app/api/admin/logout/route.ts
//
// POST: destroy the admin session. Gated behind isAdminEnabled() (404 in
// production). Returns 405 for any non-POST method.

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'

export async function POST() {
  if (!isAdminEnabled()) {
    return new NextResponse(null, { status: 404 })
  }

  const session = await getSession()
  session.destroy()
  return NextResponse.json({ ok: true })
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
