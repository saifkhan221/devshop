import { throttle } from '@/utils/requestThrottler'

const MODE = import.meta.env.VITE_AUTH_MODE
const LS_KEY = 'devshop_projects'
const getLocal = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]')
const saveLocal = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data))

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
    return throttle('db:getProjects', async () => {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      const q = query(collection(db,'projects'), where('userId','==',userId))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, DB_THROTTLE)
  },

  async createProject(userId, project) {
    if (MODE === 'dummy') {
      const projects = getLocal()
      const newProject = { ...project, id:'proj-'+Date.now(), createdAt:new Date().toISOString().split('T')[0] }
      projects.unshift(newProject); saveLocal(projects); return newProject
    }
    return throttle('db:createProject', async () => {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      const ref = await addDoc(collection(db,'projects'), { ...project, userId, createdAt: serverTimestamp() })
      return { id: ref.id, ...project }
    }, DB_THROTTLE)
  },

  async updateProject(projectId, data) {
    if (MODE === 'dummy') {
      const projects = getLocal()
      const idx = projects.findIndex(p => p.id === projectId)
      if (idx !== -1) { projects[idx] = { ...projects[idx], ...data }; saveLocal(projects) }
      return
    }
    return throttle('db:updateProject', async () => {
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      await updateDoc(doc(db,'projects',projectId), data)
    }, DB_THROTTLE)
  },

  async deleteProject(projectId) {
    if (MODE === 'dummy') { saveLocal(getLocal().filter(p => p.id !== projectId)); return }
    return throttle('db:deleteProject', async () => {
      const { doc, deleteDoc } = await import('firebase/firestore')
      const { db } = await import('./firebase')
      await deleteDoc(doc(db,'projects',projectId))
    }, DB_THROTTLE)
  }
}
