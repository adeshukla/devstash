// app/api/admin/login/route.ts
//
// POST: password login for the local-only admin panel. Gated behind
// isAdminEnabled() (404 in production) and fails safe when secrets are missing
// or misconfigured. The password comparison is constant-time (Requirement 5.1).
// Secrets (ADMIN_PASSWORD, SESSION_SECRET) are read server-side only here and
// are never returned to the client.

import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getSession } from '@/lib/auth/session'
import { isAdminEnabled } from '@/lib/auth/adminEnabled'

export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return new NextResponse(null, { status: 404 })
  }

  // Fail safe: never allow login when the admin is not fully configured.
  const adminPassword = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.SESSION_SECRET
  if (!adminPassword || !sessionSecret || sessionSecret.length < 32) {
    return NextResponse.json({ error: 'Admin is not configured.' }, { status: 500 })
  }

  try {
    let submitted: unknown
    try {
      const body = (await request.json()) as { password?: unknown }
      submitted = body.password
    } catch {
      // Malformed/empty body — treat as a failed attempt.
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    if (typeof submitted !== 'string' || submitted.length === 0) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    // Hash both values to fixed-length SHA-256 digests before comparing. This
    // guarantees equal-length buffers for timingSafeEqual and avoids leaking the
    // expected password's length through a comparison error.
    const submittedHash = crypto.createHash('sha256').update(submitted, 'utf8').digest()
    const expectedHash = crypto.createHash('sha256').update(adminPassword, 'utf8').digest()
    const match = crypto.timingSafeEqual(submittedHash, expectedHash)

    if (!match) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    const session = await getSession()
    session.isAdmin = true
    await session.save()
    return NextResponse.json({ ok: true })
  } catch (error) {
    // Log server-side only; never leak secrets or stack traces to the client.
    console.error('[admin/login] unexpected error', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
