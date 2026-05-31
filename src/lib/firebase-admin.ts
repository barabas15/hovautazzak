import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let cachedApp: App | null = null

/**
 * Lazily initialize the Firebase Admin app. Kept lazy (not run at import time)
 * so that `next build` can import API route modules without the service
 * account env var being present.
 */
function getAdminApp(): App {
  if (cachedApp) return cachedApp
  if (getApps().length) {
    cachedApp = getApps()[0]
    return cachedApp
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set')
  }
  const serviceAccount = JSON.parse(raw)
  cachedApp = initializeApp({ credential: cert(serviceAccount) })
  return cachedApp
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp())
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
