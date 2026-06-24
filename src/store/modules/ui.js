/**
 * UI Module
 *
 * Manages global UI state — toasts, modals, and the active tool.
 *
 * State:
 *   toasts      → array of active toast notifications
 *   modals      → which modals are open (true/false)
 *   activeToolId → the tool currently shown in ProjectBoardView
 *
 * Actions:
 *   toast({ message, type }) → shows a toast for 3 seconds
 *                              type: 'success' | 'error' | 'info'
 *
 * Mutations (called directly if needed):
 *   TOGGLE_MODAL({ name, value }) → open/close a modal by name
 *   SET_ACTIVE_TOOL(toolId)       → switch the active tool in the board
 *
 * Modal names:
 *   'newProject'    → New Project creation modal on dashboard
 *   'deleteConfirm' → Delete confirmation modal
 */
export default {
  namespaced: true,

  // ─── State ────────────────────────────────────────────────────────────────
  state: () => ({
    toasts: [],

    modals: {
      newProject:    false,
      deleteConfirm: false,
    },

    activeToolId: null,
  }),

  // ─── Mutations (sync, direct state changes) ───────────────────────────────
  mutations: {
    ADD_TOAST(state, toast) {
      state.toasts.push({ id: Date.now(), ...toast })
    },

    REMOVE_TOAST(state, id) {
      state.toasts = state.toasts.filter((t) => t.id !== id)
    },

    // Usage: commit('ui/TOGGLE_MODAL', { name: 'newProject', value: true })
    TOGGLE_MODAL(state, { name, value }) {
      state.modals[name] = value
    },

    // Usage: commit('ui/SET_ACTIVE_TOOL', 'kanban')
    SET_ACTIVE_TOOL(state, toolId) {
      state.activeToolId = toolId
    },
  },

  // ─── Actions (async, call mutations when done) ────────────────────────────
  actions: {
    // Show a toast notification that auto-dismisses after 3 seconds
    // Usage: dispatch('ui/toast', { message: 'Saved!', type: 'success' })
    toast({ commit }, { message, type = 'success' }) {
      const id = Date.now()
      commit('ADD_TOAST', { id, message, type })
      setTimeout(() => commit('REMOVE_TOAST', id), 3000)
    },
  },
}
