import { checkRateLimit, recordFailedAttempt, clearRateLimit, safeParseUser } from '@/utils/security'

const MODE = import.meta.env.VITE_AUTH_MODE

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
      const user = {
        uid: 'dummy-user-001',
        name: 'Saif K.',
        email,
        initials: 'SK'
      }
      localStorage.setItem('devshop_user', JSON.stringify(user))
      return user
    }

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('./firebase')
      const result = await signInWithEmailAndPassword(auth, email, password)
      clearRateLimit()
      return result.user
    } catch (e) {
      recordFailedAttempt()
      // Don't expose internal Firebase error codes to the UI
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
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
      const { auth } = await import('./firebase')
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: name })
      return result.user
    } catch (e) {
      // Map Firebase error codes to safe messages
      if (e.code === 'auth/email-already-in-use') throw new Error('An account with this email already exists.')
      if (e.code === 'auth/weak-password') throw new Error('Password is too weak.')
      throw new Error('Could not create account. Please try again.')
    }
  },

  async logout() {
    if (MODE === 'dummy') {
      localStorage.removeItem('devshop_user')
      return
    }
    const { signOut } = await import('firebase/auth')
    const { auth } = await import('./firebase')
    await signOut(auth)
  },

  getCurrentUser() {
    if (MODE === 'dummy') {
      const stored = localStorage.getItem('devshop_user')
      return safeParseUser(stored) // validate shape before trusting
    }
    return null
  }
}
