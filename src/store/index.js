import { createStore } from 'vuex'
import auth from './modules/auth'
import projects from './modules/projects'
import ui from './modules/ui'

/**
 * Root Vuex Store
 *
 * Modules:
 *   auth     → current user, login/logout state
 *   projects → all projects, CRUD operations
 *   ui       → toasts, modals, active tool
 *
 * Usage in components:
 *   const store = useStore()
 *   store.getters['auth/isLoggedIn']
 *   store.dispatch('projects/fetchProjects')
 */
export const store = createStore({
  modules: {
    auth,
    projects,
    ui,
  },

  // Warns if state is mutated outside of mutations (dev only)
  strict: import.meta.env.DEV,
})

export default store
