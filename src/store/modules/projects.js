import { dbService } from '@/services/db'

/**
 * Projects Module
 *
 * Manages all projects for the logged-in user.
 *
 * State:
 *   projects        → array of project objects
 *   loading         → true while fetching from DB
 *   activeProjectId → the project currently open in ProjectBoardView
 *
 * Getters:
 *   allProjects   → full projects array
 *   activeProject → the currently open project object
 *   projectById   → (id) => project — use for looking up a single project
 *
 * Actions:
 *   fetchProjects               → load all projects from DB on dashboard mount
 *   createProject(projectData)  → create + add to state
 *   updateProject({ id, data }) → partial update (any fields)
 *   deleteProject(id)           → remove from DB + state
 *   updateToolOrder({ projectId, toolOrder }) → saves drag-drop sidebar order
 */
export default {
  namespaced: true,

  // ─── State ────────────────────────────────────────────────────────────────
  state: () => ({
    projects: [],
    loading: false,
    activeProjectId: null,
  }),

  // ─── Getters ──────────────────────────────────────────────────────────────
  getters: {
    allProjects:   (state) => state.projects,
    activeProject: (state) => state.projects.find((p) => p.id === state.activeProjectId),
    projectById:   (state) => (id) => state.projects.find((p) => p.id === id),
  },

  // ─── Mutations (sync, direct state changes) ───────────────────────────────
  mutations: {
    SET_PROJECTS(state, projects) {
      state.projects = projects
    },

    ADD_PROJECT(state, project) {
      // Prepend so newest shows first
      state.projects.unshift(project)
    },

    UPDATE_PROJECT(state, { id, data }) {
      const index = state.projects.findIndex((p) => p.id === id)
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...data }
      }
    },

    DELETE_PROJECT(state, id) {
      state.projects = state.projects.filter((p) => p.id !== id)
    },

    SET_ACTIVE_PROJECT(state, id) {
      state.activeProjectId = id
    },

    SET_LOADING(state, value) {
      state.loading = value
    },
  },

  // ─── Actions (async, call mutations when done) ────────────────────────────
  actions: {
    // Fetch all projects for the logged-in user and load into state
    async fetchProjects({ commit, rootGetters }) {
      commit('SET_LOADING', true)
      try {
        const user = rootGetters['auth/currentUser']
        const projects = await dbService.getProjects(user?.uid, (fresh) => {
          commit('SET_PROJECTS', fresh)
        })
        commit('SET_PROJECTS', projects)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    // Create a new project in DB then add it to state immediately (optimistic)
    async createProject({ commit, rootGetters }, projectData) {
      const user = rootGetters['auth/currentUser']
      const project = await dbService.createProject(user?.uid, projectData)
      commit('ADD_PROJECT', project)
      return project
    },

    // Partial update — pass only the fields you want to change
    // e.g. dispatch('projects/updateProject', { id, data: { name: 'New Name' } })
    async updateProject({ commit, rootGetters }, { id, data }) {
      const user = rootGetters['auth/currentUser']
      await dbService.updateProject(id, data, user?.uid)
      commit('UPDATE_PROJECT', { id, data })
    },

    // Delete project from DB then remove from state
    async deleteProject({ commit }, id) {
      await dbService.deleteProject(id)
      commit('DELETE_PROJECT', id)
    },

    // Called when user drags tools in the sidebar to reorder them
    async updateToolOrder({ commit, dispatch }, { projectId, toolOrder }) {
      // Update state immediately so the UI feels instant
      commit('UPDATE_PROJECT', { id: projectId, data: { toolOrder } })
      // Then persist to DB in the background
      await dispatch('updateProject', { id: projectId, data: { toolOrder } })
    },
  },
}
