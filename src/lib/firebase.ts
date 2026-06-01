import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// NEXT_PUBLIC_ vars are inlined at build time. Guard against missing values
// during prerender so the build doesn't crash when env vars aren't set yet.
const app: FirebaseApp | null = firebaseConfig.apiKey
  ? getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  : null

export const auth: Auth | null = app ? getAuth(app) : null
export default app
