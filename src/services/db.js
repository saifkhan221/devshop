import { throttle } from '@/utils/requestThrottler'

const MODE = import.meta.env.VITE_AUTH_MODE

// ─── Firestore module cache ────────────────────────────────────────────────
let _fs = null
async function fs() {
  if (!_fs) {
    const [{ db }, firestore] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ])
    _fs = { db, ...firestore }
  }
  return _fs
}
const LS_KEY       = 'devshop_projects'
const LS_FB_CACHE  = (uid) => `devshop_projects_cache_${uid}`   // Firebase project cache per user
const getLocal     = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]')
const saveLocal    = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data))

// Throttle config for Firestore operations
// Max 30 DB calls per second per action key — prevents runaway loops hammering Firebase
const DB_THROTTLE = { maxTokens: 30, refillRate: 10, windowMs: 1000, maxQueue: 5 }

const DUMMY_PROJECTS = [
  { id:'proj-001', name:'E-Commerce Redesign', description:'Redesigning the product page and checkout flow.', color:'#7c3aed', emoji:'🛒', tools:['px-to-rem','box-shadow','task-list','contrast-checker','kanban'], toolOrder:['px-to-rem','box-shadow','task-list','contrast-checker','kanban'], createdAt:'2026-06-11' },
  { id:'proj-002', name:'Analytics Dashboard', description:'Building a data visualization dashboard.', color:'#059669', emoji:'📊', tools:['px-to-rem','json-formatter','code-snippets','task-list'], toolOrder:['px-to-rem','json-formatter','code-snippets','task-list'], createdAt:'2026-06-09' },
  { id:'proj-003', name:'Mobile App UI', description:'Designing the onboarding flow for a fitness app.', color:'#f59e0b', emoji:'📱', tools:['px-to-rem','color-palette','contrast-checker','breakpoint-tester'], toolOrder:['px-to-rem','color-palette','contrast-checker','breakpoint-tester'], createdAt:'2026-06-06' }
]

export const dbService = {
  async getProjects(userId) {
    if (MODE === 'dummy') {
      const projects = getLocal()
      if (projects.length === 0) { saveLocal(DUMMY_PROJECTS); return DUMMY_PROJECTS }
      return projects
    }
    // Return cache instantly if available (stale-while-revalidate)
    const cacheKey = LS_FB_CACHE(userId)
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      // Kick off background refresh — caller gets cache immediately
      throttle('db:getProjects', async () => {
        const { db, collection, query, where, getDocs } = await fs()
        const q = query(collection(db,'projects'), where('userId','==',userId))
        const snap = await getDocs(q)
        const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        localStorage.setItem(cacheKey, JSON.stringify(fresh))
        return fresh
      }, DB_THROTTLE).catch(() => {})
      return JSON.parse(cached)
    }
    // First load — must wait for Firestore
    return throttle('db:getProjects', async () => {
      const { db, collection, query, where, getDocs } = await fs()
      const q = query(collection(db,'projects'), where('userId','==',userId))
      const snap = await getDocs(q)
      const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      localStorage.setItem(cacheKey, JSON.stringify(projects))
      return projects
    }, DB_THROTTLE)
  },

  async createProject(userId, project) {
    if (MODE === 'dummy') {
      const projects = getLocal()
      const newProject = { ...project, id:'proj-'+Date.now(), createdAt:new Date().toISOString().split('T')[0] }
      projects.unshift(newProject); saveLocal(projects); return newProject
    }
    return throttle('db:createProject', async () => {
      const { db, collection, addDoc, serverTimestamp } = await fs()
      const ref = await addDoc(collection(db,'projects'), { ...project, userId, createdAt: serverTimestamp() })
      const newProject = { id: ref.id, ...project }
      // Update cache
      const cacheKey = LS_FB_CACHE(userId)
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]')
      localStorage.setItem(cacheKey, JSON.stringify([newProject, ...cached]))
      return newProject
    }, DB_THROTTLE)
  },

  async updateProject(projectId, data, userId) {
    if (MODE === 'dummy') {
      const projects = getLocal()
      const idx = projects.findIndex(p => p.id === projectId)
      if (idx !== -1) { projects[idx] = { ...projects[idx], ...data }; saveLocal(projects) }
      return
    }
    return throttle('db:updateProject', async () => {
      const { db, doc, updateDoc } = await fs()
      await updateDoc(doc(db,'projects',projectId), data)
      // Update cache if userId provided
      if (userId) {
        const cacheKey = LS_FB_CACHE(userId)
        const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]')
        const idx = cached.findIndex(p => p.id === projectId)
        if (idx !== -1) { cached[idx] = { ...cached[idx], ...data }; localStorage.setItem(cacheKey, JSON.stringify(cached)) }
      }
    }, DB_THROTTLE)
  },

  async deleteProject(projectId, userId) {
    if (MODE === 'dummy') { saveLocal(getLocal().filter(p => p.id !== projectId)); return }
    return throttle('db:deleteProject', async () => {
      const { db, doc, deleteDoc } = await fs()
      await deleteDoc(doc(db,'projects',projectId))
      // Update cache
      if (userId) {
        const cacheKey = LS_FB_CACHE(userId)
        const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]')
        localStorage.setItem(cacheKey, JSON.stringify(cached.filter(p => p.id !== projectId)))
      }
    }, DB_THROTTLE)
  }
}
