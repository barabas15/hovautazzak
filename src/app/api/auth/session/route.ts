import { NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { SESSION_COOKIE } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Firebase ID tokens are valid for 1 hour; mirror that in the cookie lifetime.
const MAX_AGE = 60 * 60

/**
 * POST { idToken } — verify the Firebase ID token and store it in an httpOnly
 * `session` cookie so server navigations (e.g. /saved) can be gated by the
 * middleware. The client should call this right after Google sign-in.
 */
export async function POST(req: Request) {
  let idToken: string | undefined
  try {
    const body = await req.json()
    idToken = body?.idToken
  } catch {
    idToken = undefined
  }
  if (!idToken) {
    return NextResponse.json({ error: 'Hiányzó idToken.' }, { status: 400 })
  }

  try {
    await getAdminAuth().verifyIdToken(idToken)
  } catch {
    return NextResponse.json({ error: 'Érvénytelen token.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return res
}

/** DELETE — clear the session cookie (call on sign-out). */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
