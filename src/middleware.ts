import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

/**
 * Edge middleware can't run the Firebase Admin SDK, so it performs a
 * presence-level gate only: it checks for a bearer token or session cookie.
 * The actual token verification happens inside the API route handlers
 * (getUidFromRequest → adminAuth.verifyIdToken).
 *
 * Protected:
 *  - /api/saved-trips/*  and  /api/trips/*  → 401 JSON when no credential
 *  - /saved                                 → redirect to / when no session
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const hasBearer = req.headers
    .get('authorization')
    ?.toLowerCase()
    .startsWith('bearer ')
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)
  const authed = hasBearer || hasSession

  const isProtectedApi =
    pathname.startsWith('/api/saved-trips') ||
    pathname.startsWith('/api/trips')

  if (isProtectedApi && !authed) {
    return NextResponse.json(
      { error: 'Bejelentkezés szükséges.' },
      { status: 401 },
    )
  }

  if (pathname === '/saved' || pathname.startsWith('/saved/')) {
    if (!hasSession) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('login', 'required')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/saved',
    '/saved/:path*',
    '/api/saved-trips',
    '/api/saved-trips/:path*',
    '/api/trips',
    '/api/trips/:path*',
  ],
}
