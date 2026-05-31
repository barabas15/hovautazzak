import { getAdminAuth } from './firebase-admin'
import { SESSION_COOKIE } from './session'

/** Parse a single cookie value from a raw Cookie header. */
function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

/**
 * Extract the Firebase ID token from a request: first the
 * `Authorization: Bearer <token>` header, then the `session` cookie.
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim()
  }
  return readCookie(req.headers.get('cookie'), SESSION_COOKIE)
}

/**
 * Verify the request's Firebase ID token and return the user's uid,
 * or null when the request is unauthenticated / the token is invalid.
 */
export async function getUidFromRequest(req: Request): Promise<string | null> {
  const token = extractToken(req)
  if (!token) return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

export { SESSION_COOKIE }
