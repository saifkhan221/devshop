import { checkRateLimit, recordFailedAttempt, clearRateLimit, safeParseUser } from '@/utils/security'

const MODE = import.meta.env.VITE_AUTH_MODE

// ─── Firebase module cache ─────────────────────────────────────────────────
// Dynamic-imported once, then reused on every subsequent call (no per-call overhead)
let _fb = null
async function fb() {
  if (!_fb) {
    const [{ auth }, firebaseAuth] = await Promise.all([
      import('./firebase'),
      import('firebase/auth'),
    ])
    _fb = { auth, ...firebaseAuth }
  }
  return _fb
}

export const authService = {
  async login(email, password) {
    // Rate limit check
    const limit = checkRateLimit()
    if (limit.blocked) {
      throw new Error(`Too many failed attempts. Try again in ${limit.remaining} minute(s).`)
    }

    if (MODE === 'dummy') {
      if (email !== 'saif@gmail.com' || password !== 'saif@123') {
        recordFailedAttempt()
        throw new Error('Invalid email or password.')
      }
      clearRateLimit()
      const user = { uid: 'dummy-user-001', name: 'Saif K.', email, initials: 'SK' }
      localStorage.setItem('devshop_user', JSON.stringify(user))
      return user
    }

    try {
      const { auth, signInWithEmailAndPassword } = await fb()
      const result = await signInWithEmailAndPassword(auth, email, password)
      clearRateLimit()
      return result.user
    } catch (e) {
      recordFailedAttempt()
      throw new Error('Invalid email or password.')
    }
  },

  async signup(name, email, password) {
    if (MODE === 'dummy') {
      const user = {
        uid: 'dummy-user-' + Date.now(),
        name,
        email,
        initials: name.split(' ').map(n => n[0]).join('').toUpperCase()
      }
      localStorage.setItem('devshop_user', JSON.stringify(user))
      return user
    }

    try {
      const { auth, createUserWithEmailAndPassword, updateProfile } = await fb()
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      return result.user
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') throw new Error('An account with this email already exists.')
      if (e.code === 'auth/weak-password') throw new Error('Password is too weak.')
      throw new Error('Could not create account. Please try again.')
    }
  },

  // Google SSO. Firebase's "one account per email" setting means a Google sign-in
  // for an email that already has a password account collides instead of creating
  // a second user. We catch that collision and hand the UI what it needs to LINK
  // Google onto the existing account, so both providers share one uid (and thus
  // all the same projects, tool data and prefs).
  async loginWithGoogle() {
    if (MODE === 'dummy') {
      const user = { uid: 'dummy-user-001', name: 'Saif K.', email: 'saif@gmail.com', initials: 'SK' }
      localStorage.setItem('devshop_user', JSON.stringify(user))
      return user
    }
    const { auth, GoogleAuthProvider, signInWithPopup } = await fb()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      const result = await signInWithPopup(auth, provider)
      return result.user
    } catch (e) {
      if (e.code === 'auth/account-exists-with-different-credential') {
        const err = new Error('This email already has a password account. Enter your password once to connect Google sign-in.')
        err.code = 'link-required'
        err.email = e.customData?.email || ''
        err.pendingCred = GoogleAuthProvider.credentialFromError(e)
        throw err
      }
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        const err = new Error('Sign-in cancelled.'); err.code = 'cancelled'; throw err
      }
      throw new Error('Google sign-in failed. Please try again.')
    }
  },

  // Sign in with the existing password account, then attach the pending Google
  // credential to it. After this the same uid works with either provider.
  async completeGoogleLink(email, password, pendingCred) {
    const { auth, signInWithEmailAndPassword, linkWithCredential } = await fb()
    const result = await signInWithEmailAndPassword(auth, email, password)
    await linkWithCredential(result.user, pendingCred)
    return result.user
  },

  async logout() {
    if (MODE === 'dummy') {
      localStorage.removeItem('devshop_user')
      return
    }
    const { auth, signOut } = await fb()
    await signOut(auth)
  },

  getCurrentUser() {
    if (MODE === 'dummy') {
      const stored = localStorage.getItem('devshop_user')
      return safeParseUser(stored)
    }
    return null
  },

  // Restores Firebase session on page reload.
  // Checks auth.currentUser first (synchronous, no round trip if already initialised),
  // then falls back to onAuthStateChanged for the cold-boot case.
  waitForUser() {
    if (MODE === 'dummy') {
      return Promise.resolve(this.getCurrentUser())
    }
    return new Promise(async (resolve) => {
      try {
        const { auth, onAuthStateChanged } = await fb()
        // Fast path: Firebase already has the user in memory
        if (auth.currentUser) return resolve(auth.currentUser)
        // Slow path: wait for Firebase to restore from IndexedDB persistence
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub()
          resolve(user || null)
        })
      } catch {
        resolve(null)
      }
    })
  }
}
