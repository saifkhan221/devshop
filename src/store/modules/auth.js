import { authService } from '@/services/auth'

/**
 * Auth Module
 *
 * Manages the logged-in user session.
 *
 * State:
 *   user    → the current user object (null if logged out)
 *   loading → true while a login/signup request is in flight
 *   error   → last auth error message (null if none)
 *
 * Getters:
 *   isLoggedIn   → boolean — use for route guards
 *   currentUser  → full user object
 *   userInitials → 'SK' — for the avatar badge
 *
 * Actions:
 *   login(email, password)        → returns true/false
 *   signup(name, email, password) → returns true/false
 *   logout()                      → clears user, redirects handled by router
 *   initAuth()                    → called once on app boot to restore session
 */
export default {
  namespaced: true,

  // ─── State ────────────────────────────────────────────────────────────────
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  // ─── Getters ──────────────────────────────────────────────────────────────
  getters: {
    isLoggedIn:   (state) => !!state.user,
    currentUser:  (state) => state.user,
    userInitials: (state) =>
      state.user?.initials ||
      state.user?.name?.split(' ').map((n) => n[0]).join('') ||
      'U',
  },

  // ─── Mutations (sync, direct state changes) ───────────────────────────────
  mutations: {
    SET_USER(state, user)     { state.user    = user  },
    SET_LOADING(state, value) { state.loading = value },
    SET_ERROR(state, message) { state.error   = message },
  },

  // ─── Actions (async, call mutations when done) ────────────────────────────
  actions: {
    async login({ commit }, { email, password }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const user = await authService.login(email, password)
        commit('SET_USER', user)
        return true
      } catch (e) {
        commit('SET_ERROR', e.message)
        return false
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async signup({ commit }, { name, email, password }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      try {
        const user = await authService.signup(name, email, password)
        commit('SET_USER', user)
        return true
      } catch (e) {
        commit('SET_ERROR', e.message)
        return false
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async logout({ commit }) {
      await authService.logout()
      commit('SET_USER', null)
    },

    // Called once in main.js before the app mounts —
    // restores the session (localStorage for dummy, Firebase persistence for firebase mode)
    async initAuth({ commit }) {
      const user = await authService.waitForUser()
      if (user) commit('SET_USER', user)
    },
  },
}
