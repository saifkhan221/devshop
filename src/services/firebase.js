import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// ─── Firebase App Check ────────────────────────────────────────────────────
// App Check verifies every request to Firebase comes from YOUR real app,
// not from a bot, scraper, or someone who copied your Firebase config.
// Without this, anyone who finds your API key can hammer your database directly.
//
// To enable:
// 1. Go to Firebase Console → App Check
// 2. Register your app with reCAPTCHA v3
// 3. Get your reCAPTCHA site key
// 4. Add to .env: VITE_RECAPTCHA_SITE_KEY=your_key_here
// 5. Enable App Check enforcement in Firebase Console
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  })
}

export const auth = getAuth(app)
export const db = getFirestore(app)
