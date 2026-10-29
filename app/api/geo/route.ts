import { NextResponse } from 'next/server'
import { getRequestGeo } from '@/lib/utils/requestContext'

// Visitor's country (ISO code) from Vercel's edge headers, so the contact
// form can pre-fill the phone prefix. Called once, when the form is first
// focused. Nothing is stored; empty outside Vercel.
export async function GET(request: Request) {
  return NextResponse.json(
    { country: getRequestGeo(request.headers).country ?? null },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
