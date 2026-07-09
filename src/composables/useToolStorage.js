/**
 * useToolStorage — per-tool data persistence with stale-while-revalidate
 *
 * Dummy mode    → localStorage only
 * Firebase mode → localStorage as instant cache (L1) + Firestore as source of truth (L2)
 *
 * On load:
 *   1. Read localStorage cache → show data instantly (loading = false immediately)
 *   2. Fetch Firestore in background → update data silently if different
 *
 * On save:
 *   1. Write localStorage immediately
 *   2. Write Firestore debounced 800ms
 *
 * Document ID includes userId so each user has their own isolated data.
 */

import { ref } from 'vue'

const MODE = import.meta.env.VITE_AUTH_MODE
const DEBOUNCE_MS = 800

// ─── Firestore module cache ───────────────────────────────────────────────
let _fs = null
async function getFs() {
  if (!_fs) {
    const [{ db }, firestore] = await Promise.all([
      import('@/services/firebase'),
      import('firebase/firestore'),
    ])
    _fs = { db, ...firestore }
  }
  return _fs
}

async function getCurrentUserId() {
  const { auth } = await import('@/services/firebase')
  return auth.currentUser?.uid || null
}

function deepClone(val) {
  return JSON.parse(JSON.stringify(val))
}

export function useToolStorage(projectId, toolId, defaultValue) {
  const data    = ref(deepClone(defaultValue))
  const loading = ref(true)

  const lsKey = `devshop_tool_${projectId}_${toolId}`

  // ─── Load ──────────────────────────────────────────────────────────────
  async function load() {
    const cached = localStorage.getItem(lsKey)
    if (cached) {
      try { data.value = JSON.parse(cached) } catch { /* corrupt — keep default */ }
    }
    loading.value = false

    if (MODE === 'dummy') return

    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const docId = `${userId}_${projectId}_${toolId}`
      const { db, doc, getDoc } = await getFs()
      const snap = await getDoc(doc(db, 'toolData', docId))
      if (snap.exists() && snap.data().data !== undefined) {
        const fresh = snap.data().data
        localStorage.setItem(lsKey, JSON.stringify(fresh))
        data.value = fresh
      }
    } catch {
      // Firestore unavailable — cached data already shown
    }
  }

  // ─── Save (debounced) ──────────────────────────────────────────────────
  let _timer = null

  function save(valueToStore) {
    const payload = valueToStore !== undefined ? valueToStore : data.value
    localStorage.setItem(lsKey, JSON.stringify(payload))
    if (_timer) clearTimeout(_timer)
    _timer = setTimeout(() => persistToFirestore(payload), DEBOUNCE_MS)
  }

  async function persistToFirestore(payload) {
    if (MODE === 'dummy') return

    try {
      const userId = await getCurrentUserId()
      if (!userId) return

      const docId = `${userId}_${projectId}_${toolId}`
      const { db, doc, setDoc } = await getFs()

      await setDoc(doc(db, 'toolData', docId), {
        userId, projectId, toolId,
        data: payload,
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      console.error('[useToolStorage] Firestore write failed for', toolId, e)
    }
  }

  load()

  return { data, loading, save }
}
