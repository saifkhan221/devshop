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
const LS_GAMESTATS = 'devshop_gamestats'

// Apply a game result to a player's stat doc (win counters, best score, best time).
function applyGamePatch(cur, patch) {
  const s = { ...cur }
  if (patch.game === 'ttt') {
    if (patch.outcome === 'win') s.tttWins = (s.tttWins || 0) + 1
    else if (patch.outcome === 'loss') s.tttLosses = (s.tttLosses || 0) + 1
    else if (patch.outcome === 'draw') s.tttDraws = (s.tttDraws || 0) + 1
  } else if (patch.game === '2048') {
    s.best2048 = Math.max(s.best2048 || 0, patch.score || 0)
  } else if (patch.game === 'sudoku') {
    const key = 'sudokuBest' + patch.diff.charAt(0).toUpperCase() + patch.diff.slice(1)
    if (!s[key] || patch.timeSec < s[key]) s[key] = patch.timeSec
  }
  return s
}
const getLocal     = () => JSON.parse(localStorage.getItem(LS_KEY) || '[]')
const saveLocal    = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data))

// Throttle config for Firestore operations
// Max 30 DB calls per second per action key - prevents runaway loops hammering Firebase
const DB_THROTTLE = { maxTokens: 30, refillRate: 10, windowMs: 1000, maxQueue: 5 }

function toMs(ts) {
  if (!ts) return 0
  if (ts.toMillis) return ts.toMillis()
  if (ts.seconds) return ts.seconds * 1000
  return new Date(ts).getTime() || 0
}

const DUMMY_PROJECTS = [
  { id:'proj-001', name:'E-Commerce Redesign', description:'Redesigning the product page and checkout flow.', color:'#7c3aed', emoji:'🛒', tools:['px-to-rem','box-shadow','task-list','contrast-checker','kanban'], toolOrder:['px-to-rem','box-shadow','task-list','contrast-checker','kanban'], createdAt:'2026-06-11' },
  { id:'proj-002', name:'Analytics Dashboard', description:'Building a data visualization dashboard.', color:'#059669', emoji:'📊', tools:['px-to-rem','json-formatter','code-snippets','task-list'], toolOrder:['px-to-rem','json-formatter','code-snippets','task-list'], createdAt:'2026-06-09' },
  { id:'proj-003', name:'Mobile App UI', description:'Designing the onboarding flow for a fitness app.', color:'#f59e0b', emoji:'📱', tools:['px-to-rem','color-palette','contrast-checker','breakpoint-tester'], toolOrder:['px-to-rem','color-palette','contrast-checker','breakpoint-tester'], createdAt:'2026-06-06' }
]

// ─── Library (shared team collection) ─────────────────────────────────────
// Unlike projects/toolData, the library is SHARED: everyone reads all entries,
// anyone can add, and each author edits/deletes their own (admin moderates any).
// Cache is global (not per-user) since the content is the same for the whole team.
const LS_LIBRARY = 'devshop_library'
const LS_LIBRARY_SEEDED = 'devshop_library_seeded'  // one-shot guard for the starter seed
const LS_LIBRARY_DASHFIX = 'devshop_library_dashfix'  // one-shot: strip em/en dashes from legacy entries

// Two landing-page dev briefs from the design team. The Core Rules block is
// identical across both variants, so it's shared here and only the intro differs.
const LANDER_TAIL = [
  '',
  'Read the [Core Rules](#core-rules) before writing any code - they are non-negotiable.',
  '',
  '---',
  '',
  '## Core Rules',
  '',
  '1. **SCSS only.** No plain CSS files, no inline styles, no utility-class frameworks.',
  '2. **Use `rem`, never `px`** - the only exceptions are hairline borders and shadows (`1px`).',
  '3. **Rem scale:** `1rem = 5px` on mobile (default), `1rem = 10px` on desktop (`>= 1400px`). See [Rem Scale](#rem-scale). Practical consequence: to get a 24px-at-desktop font size, write `2.4rem`.',
  '',
  '   ```css',
  '   /* Paste this block at the TOP of your stylesheet - do not change it */',
  '',
  '   html { font-size: 5px; }',
  '   @media (min-width: 576px)  { html { font-size: 6px; } }',
  '   @media (min-width: 768px)  { html { font-size: 7px; } }',
  '   @media (min-width: 992px)  { html { font-size: 8px; } }',
  '   @media (min-width: 1200px) { html { font-size: 9px; } }',
  '   @media (min-width: 1400px) { html { font-size: 10px; } }',
  '   ```',
  '',
  '4. **Use CSS custom properties (CSS variables)** for values that are themed, animated, or shared across components (durations, delays, radii, dynamic viewport heights).',
  '5. **Media queries live inside the selector they affect**, using SCSS nesting - never in separate "responsive" files or grouped at the bottom.',
  '6. **BEM naming:** `.block__element--modifier`. The block is the section or component name.',
  '7. **No comments unless the reason is non-obvious.** A comment explains *why*, never *what*.',
  '8. **Images: proper `alt` text, and always use `<picture>` tags.** Every image needs a descriptive, accurate `alt` attribute (empty `alt=""` only for purely decorative images) and should be marked up with `<picture>` (with appropriate `<source>` variants), not a bare `<img>`.',
  '9. **Lazy-load below the fold, eager-load the first section.** Images inside the first section/hero load eagerly (`loading="eager"`, and mark the LCP image with `fetchpriority="high"`); every image after the first section uses `loading="lazy"`.',
  '10. **Google PageSpeed scores must be good, accessibility included.** Treat Lighthouse/PageSpeed performance *and* accessibility scores as non-negotiable - this covers the above (alt text, picture tags, lazy/eager loading) plus general a11y basics (semantic HTML, sufficient color contrast, keyboard navigability).',
].join('\n')

const landerBody = (intro) =>
  ['# Landing Page Development - Getting Started', '', intro, LANDER_TAIL].join('\n')

// The two design-team briefs, defined once so they can be used as dummy-mode
// seed data AND written into Firestore as shared starter content (see
// seedLibrary). The fixed docId keeps the Firestore seed idempotent.
const LANDER_SEED = [
  {
    docId: 'lander-new', type: 'prompt', title: 'New Landing Page - Dev Brief (Laravel)',
    tags: ['landing-page', 'laravel', 'scss', 'brief'],
    body: landerBody('I am a designer. Instructions for building a new marketing landing page, following our brand guidelines and front-end conventions. The page should be developed using Laravel, SCSS & ES6 to keep it scalable & maintainable.'),
  },
  {
    docId: 'lander-existing', type: 'prompt', title: 'Existing Landing Page - Dev Brief (HTML handoff)',
    tags: ['landing-page', 'html', 'scss', 'brief'],
    body: landerBody('I am a designer. Instructions for building a new marketing landing page, following our brand guidelines and front-end conventions. The page will be integrated into a Laravel codebase that uses SCSS & ES6. Please output the page as basic HTML so a dev can integrate it easily, but do suggest a better way of doing this if you have any ideas.'),
  },
]

const DUMMY_LIBRARY = [
  ...LANDER_SEED.map(({ docId, ...rest }, i) => ({
    id: docId, ...rest,
    authorId: 'dummy-user', authorName: 'saif@gmail.com',
    createdAt: i === 0 ? '2026-09-02T09:00:00.000Z' : '2026-09-01T09:00:00.000Z',
    updatedAt: i === 0 ? '2026-09-02T09:00:00.000Z' : '2026-09-01T09:00:00.000Z',
  })),
  {
    id: 'lib-001', type: 'prompt', title: 'Component-from-Figma prompt',
    tags: ['vue', 'figma', 'frontend'],
    body: '## Convert this Figma frame to a Vue component\n\nBuild a **single-file Vue 3 component** from the selected frame.\n\n- Use `<script setup>` and the Composition API\n- Match spacing, colours and typography exactly - use `rem` units\n- Extract repeated values into props\n- Keep it accessible (labels, roles, focus states)\n\n> Ask me before adding any new dependency.',
    authorId: 'dummy-user', authorName: 'saif@gmail.com',
    createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'lib-002', type: 'skill', title: 'Design review checklist',
    tags: ['design', 'qa'],
    body: '# Design Review Skill\n\nWhen reviewing a screen, check in order:\n\n1. **Hierarchy** - is the primary action obvious?\n2. **Spacing** - consistent 4/8px rhythm?\n3. **Contrast** - text passes WCAG AA?\n4. **States** - hover, focus, disabled, empty, error?\n5. **Responsive** - does it hold at 375px?\n\nReturn findings as a short bulleted list, most important first.',
    authorId: 'dummy-user', authorName: 'saif@gmail.com',
    createdAt: '2026-08-22T09:00:00.000Z', updatedAt: '2026-08-22T09:00:00.000Z',
  },
  {
    id: 'lib-003', type: 'general', title: 'Tone & voice for UI copy',
    tags: ['copy', 'brand'],
    body: 'Keep microcopy **clear, short, and human**.\n\n- Prefer verbs: "Save changes", not "Submission"\n- No jargon, no exclamation overload\n- Errors say what happened *and* how to fix it',
    authorId: 'dummy-user', authorName: 'saif@gmail.com',
    createdAt: '2026-08-25T14:30:00.000Z', updatedAt: '2026-08-25T14:30:00.000Z',
  },
]

function sortLibrary(list) {
  return [...list].sort((a, b) => toMs(b.updatedAt || b.createdAt) - toMs(a.updatedAt || a.createdAt))
}

// Writes the starter briefs into Firestore with fixed doc IDs (idempotent -
// re-running overwrites the same docs instead of duplicating). authorId must be
// the current uid to satisfy the library security rules.
async function seedLibrary(auth) {
  const { db, doc, setDoc, serverTimestamp } = await fs()
  const now = new Date().toISOString()
  const seeded = []
  for (const { docId, ...rest } of LANDER_SEED) {
    const data = { authorId: auth.uid, authorName: auth.email || '', ...rest }
    await setDoc(doc(db, 'library', docId), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    seeded.push({ id: docId, ...data, createdAt: now, updatedAt: now })
  }
  return seeded
}

// One-time cleanup: the original starter briefs were seeded with em/en dashes in
// their title/body. Rewrite any entry that still contains them. Best-effort: the
// security rules only let the author or admin write, so entries the current user
// can't edit are left for someone who can (the shared doc gets fixed either way).
async function migrateLibraryDashes(list) {
  if (localStorage.getItem(LS_LIBRARY_DASHFIX)) return list
  const hasDash = (s) => /[—–]/.test(s || '')
  const strip = (s) => (s || '').replace(/[—–]/g, '-')
  const targets = list.filter(e => hasDash(e.title) || hasDash(e.body))
  if (targets.length) {
    const { db, doc, updateDoc } = await fs()
    for (const e of targets) {
      const title = strip(e.title), body = strip(e.body)
      try {
        await updateDoc(doc(db, 'library', e.id), { title, body })
        e.title = title; e.body = body
      } catch { /* not permitted for this user */ }
    }
  }
  localStorage.setItem(LS_LIBRARY_DASHFIX, '1')
  return list
}

export const dbService = {
  async getProjects(userId, onRefresh) {
    if (MODE === 'dummy') {
      const projects = getLocal()
      if (projects.length === 0) { saveLocal(DUMMY_PROJECTS); return DUMMY_PROJECTS }
      return projects
    }
    // Return cache instantly if available (stale-while-revalidate)
    const cacheKey = LS_FB_CACHE(userId)
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      // Kick off background refresh - caller gets cache immediately
      throttle('db:getProjects', async () => {
        const { db, collection, query, where, getDocs } = await fs()
        const q = query(collection(db,'projects'), where('userId','==',userId))
        const snap = await getDocs(q)
        const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        localStorage.setItem(cacheKey, JSON.stringify(fresh))
        if (onRefresh) onRefresh(fresh)
        return fresh
      }, DB_THROTTLE).catch(() => {})
      return JSON.parse(cached)
    }
    // First load - must wait for Firestore
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

  // ─── Feedback ──────────────────────────────────────────────────────

  async submitFeedback(userId, data) {
    if (MODE === 'dummy') {
      const key = 'devshop_feedback'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      const item = { id: 'fb-' + Date.now(), userId, ...data, createdAt: new Date().toISOString() }
      list.unshift(item)
      localStorage.setItem(key, JSON.stringify(list))
      return item
    }
    return throttle('db:submitFeedback', async () => {
      const { db, collection, addDoc, serverTimestamp } = await fs()
      const ref = await addDoc(collection(db, 'feedback'), {
        userId,
        ...data,
        createdAt: serverTimestamp(),
      })
      return { id: ref.id, userId, ...data }
    }, DB_THROTTLE)
  },

  async getUserFeedback(userId) {
    if (MODE === 'dummy') {
      const list = JSON.parse(localStorage.getItem('devshop_feedback') || '[]')
      return list.filter(f => f.userId === userId)
    }
    return throttle('db:getUserFeedback', async () => {
      const { db, collection, query, where, getDocs } = await fs()
      const q = query(collection(db, 'feedback'), where('userId', '==', userId))
      const snap = await getDocs(q)
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      results.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      return results
    }, DB_THROTTLE)
  },

  async getAllFeedback() {
    if (MODE === 'dummy') {
      return JSON.parse(localStorage.getItem('devshop_feedback') || '[]')
    }
    return throttle('db:getAllFeedback', async () => {
      const { db, collection, getDocs } = await fs()
      const snap = await getDocs(collection(db, 'feedback'))
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      results.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      return results
    }, DB_THROTTLE)
  },

  async deleteFeedback(feedbackId) {
    if (MODE === 'dummy') {
      const key = 'devshop_feedback'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify(list.filter(f => f.id !== feedbackId)))
      return
    }
    return throttle('db:deleteFeedback', async () => {
      const { db, doc, deleteDoc } = await fs()
      await deleteDoc(doc(db, 'feedback', feedbackId))
    }, DB_THROTTLE)
  },

  // ─── Library (shared, collaborative) ────────────────────────────────

  // Stale-while-revalidate: return the cached list instantly, refresh in the
  // background and hand fresh data back through onRefresh (mirrors getProjects).
  async getLibraryEntries(auth, onRefresh) {
    if (MODE === 'dummy') {
      const list = JSON.parse(localStorage.getItem(LS_LIBRARY) || 'null')
      if (!list) { localStorage.setItem(LS_LIBRARY, JSON.stringify(DUMMY_LIBRARY)); return sortLibrary(DUMMY_LIBRARY) }
      return sortLibrary(list)
    }
    const cached = localStorage.getItem(LS_LIBRARY)
    if (cached) {
      throttle('db:getLibrary', async () => {
        const { db, collection, getDocs } = await fs()
        const snap = await getDocs(collection(db, 'library'))
        let fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        fresh = await migrateLibraryDashes(fresh)
        localStorage.setItem(LS_LIBRARY, JSON.stringify(fresh))
        if (onRefresh) onRefresh(sortLibrary(fresh))
        return fresh
      }, DB_THROTTLE).catch(() => {})
      return sortLibrary(JSON.parse(cached))
    }
    return throttle('db:getLibrary', async () => {
      const { db, collection, getDocs } = await fs()
      const snap = await getDocs(collection(db, 'library'))
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      // First time the shared library is empty, write the design-team starter
      // briefs so the team sees them without anyone pasting. Fixed doc IDs make
      // this idempotent; the flag stops it re-seeding after intentional deletes.
      if (list.length === 0 && auth?.uid && !localStorage.getItem(LS_LIBRARY_SEEDED)) {
        list = await seedLibrary(auth)
        localStorage.setItem(LS_LIBRARY_SEEDED, '1')
      }
      list = await migrateLibraryDashes(list)
      localStorage.setItem(LS_LIBRARY, JSON.stringify(list))
      return sortLibrary(list)
    }, DB_THROTTLE)
  },

  async createLibraryEntry(userId, data) {
    const now = new Date().toISOString()
    if (MODE === 'dummy') {
      const list = JSON.parse(localStorage.getItem(LS_LIBRARY) || '[]')
      const item = { id: 'lib-' + Date.now(), authorId: userId, ...data, createdAt: now, updatedAt: now }
      list.unshift(item)
      localStorage.setItem(LS_LIBRARY, JSON.stringify(list))
      return item
    }
    return throttle('db:createLibrary', async () => {
      const { db, collection, addDoc, serverTimestamp } = await fs()
      const payload = { authorId: userId, ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      const ref = await addDoc(collection(db, 'library'), payload)
      const item = { id: ref.id, authorId: userId, ...data, createdAt: now, updatedAt: now }
      const cached = JSON.parse(localStorage.getItem(LS_LIBRARY) || '[]')
      localStorage.setItem(LS_LIBRARY, JSON.stringify([item, ...cached]))
      return item
    }, DB_THROTTLE)
  },

  async updateLibraryEntry(entryId, data) {
    const now = new Date().toISOString()
    if (MODE === 'dummy') {
      const list = JSON.parse(localStorage.getItem(LS_LIBRARY) || '[]')
      const idx = list.findIndex(e => e.id === entryId)
      if (idx !== -1) { list[idx] = { ...list[idx], ...data, updatedAt: now }; localStorage.setItem(LS_LIBRARY, JSON.stringify(list)) }
      return
    }
    return throttle('db:updateLibrary', async () => {
      const { db, doc, updateDoc, serverTimestamp } = await fs()
      await updateDoc(doc(db, 'library', entryId), { ...data, updatedAt: serverTimestamp() })
      const cached = JSON.parse(localStorage.getItem(LS_LIBRARY) || '[]')
      const idx = cached.findIndex(e => e.id === entryId)
      if (idx !== -1) { cached[idx] = { ...cached[idx], ...data, updatedAt: now }; localStorage.setItem(LS_LIBRARY, JSON.stringify(cached)) }
    }, DB_THROTTLE)
  },

  async deleteLibraryEntry(entryId) {
    if (MODE === 'dummy') {
      const list = JSON.parse(localStorage.getItem(LS_LIBRARY) || '[]')
      localStorage.setItem(LS_LIBRARY, JSON.stringify(list.filter(e => e.id !== entryId)))
      return
    }
    return throttle('db:deleteLibrary', async () => {
      const { db, doc, deleteDoc } = await fs()
      await deleteDoc(doc(db, 'library', entryId))
      const cached = JSON.parse(localStorage.getItem(LS_LIBRARY) || '[]')
      localStorage.setItem(LS_LIBRARY, JSON.stringify(cached.filter(e => e.id !== entryId)))
    }, DB_THROTTLE)
  },

  // ─── Dev Log (admin only) ───────────────────────────────────────────

  async getDevLog() {
    if (MODE === 'dummy') {
      return JSON.parse(localStorage.getItem('devshop_devlog') || '[]')
    }
    return throttle('db:getDevLog', async () => {
      const { db, collection, getDocs } = await fs()
      const snap = await getDocs(collection(db, 'devlog'))
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      results.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
      return results
    }, DB_THROTTLE)
  },

  async addDevLogEntry(data) {
    if (MODE === 'dummy') {
      const key = 'devshop_devlog'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      const item = { id: 'dl-' + Date.now(), ...data, createdAt: new Date().toISOString() }
      list.unshift(item)
      localStorage.setItem(key, JSON.stringify(list))
      return item
    }
    return throttle('db:addDevLogEntry', async () => {
      const { db, collection, addDoc, serverTimestamp } = await fs()
      const ref = await addDoc(collection(db, 'devlog'), {
        ...data,
        createdAt: serverTimestamp(),
      })
      return { id: ref.id, ...data }
    }, DB_THROTTLE)
  },

  async deleteDevLogEntry(entryId) {
    if (MODE === 'dummy') {
      const key = 'devshop_devlog'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      localStorage.setItem(key, JSON.stringify(list.filter(e => e.id !== entryId)))
      return
    }
    return throttle('db:deleteDevLogEntry', async () => {
      const { db, doc, deleteDoc } = await fs()
      await deleteDoc(doc(db, 'devlog', entryId))
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
  },

  // ─── Game leaderboard (shared, one doc per player) ──────────────────
  async getGameStats(onRefresh) {
    if (MODE === 'dummy') {
      const raw = localStorage.getItem(LS_GAMESTATS)
      return raw ? [JSON.parse(raw)] : []
    }
    const cacheKey = LS_GAMESTATS + '_all'
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      throttle('db:getGameStats', async () => {
        const { db, collection, getDocs } = await fs()
        const snap = await getDocs(collection(db, 'gameStats'))
        const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        localStorage.setItem(cacheKey, JSON.stringify(fresh))
        if (onRefresh) onRefresh(fresh)
        return fresh
      }, DB_THROTTLE).catch(() => {})
      return JSON.parse(cached)
    }
    return throttle('db:getGameStats', async () => {
      const { db, collection, getDocs } = await fs()
      const snap = await getDocs(collection(db, 'gameStats'))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      localStorage.setItem(cacheKey, JSON.stringify(list))
      return list
    }, DB_THROTTLE)
  },

  async recordGame(auth, patch) {
    if (MODE === 'dummy') {
      const raw = localStorage.getItem(LS_GAMESTATS)
      const cur = raw ? JSON.parse(raw) : { id: 'dummy-user', uid: 'dummy-user', name: auth?.email || 'You' }
      const next = applyGamePatch(cur, patch)
      localStorage.setItem(LS_GAMESTATS, JSON.stringify(next))
      return next
    }
    if (!auth?.uid) return
    return throttle('db:recordGame', async () => {
      const { db, doc, getDoc, setDoc, serverTimestamp } = await fs()
      const ref = doc(db, 'gameStats', auth.uid)
      const snap = await getDoc(ref)
      const next = applyGamePatch(snap.exists() ? snap.data() : {}, patch)
      next.uid = auth.uid
      next.name = auth.email || auth.name || 'Player'
      await setDoc(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true })
      // keep the leaderboard cache in sync
      try {
        const cacheKey = LS_GAMESTATS + '_all'
        const all = JSON.parse(localStorage.getItem(cacheKey) || '[]')
        const rec = { id: auth.uid, ...next }
        const idx = all.findIndex(x => x.id === auth.uid)
        if (idx !== -1) all[idx] = rec; else all.push(rec)
        localStorage.setItem(cacheKey, JSON.stringify(all))
      } catch { /* cache is best-effort */ }
      return next
    }, DB_THROTTLE)
  }
}
