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

function deepClone(val) {
  return JSON.parse(JSON.stringify(val))
}

export function useToolStorage(projectId, toolId, defaultValue) {
  const data    = ref(deepClone(defaultValue))
  const loading = ref(true)

  const lsKey = `devshop_tool_${projectId}_${toolId}`
  const docId = `${projectId}_${toolId}`

  // ─── Load ──────────────────────────────────────────────────────────────
  async function load() {
    // Step 1: read localStorage cache — instant, no network
    const cached = localStorage.getItem(lsKey)
    if (cached) {
      try { data.value = JSON.parse(cached) } catch { /* corrupt — keep default */ }
    }
    loading.value = false   // ← show tool immediately with cached data

    if (MODE === 'dummy') return

    // Step 2 (Firebase only): refresh from Firestore in background
    try {
      const { db, doc, getDoc } = await getFs()
      const snap = await getDoc(doc(db, 'toolData', docId))
      if (snap.exists() && snap.data().data !== undefined) {
        const fresh = snap.data().data
        // Update cache + reactive data with latest from Firestore
        localStorage.setItem(lsKey, JSON.stringify(fresh))
        data.value = fresh
      }
    } catch {
      // Firestore unavailable — cached data already shown, nothing to do
    }
  }

  // ─── Save (debounced) ──────────────────────────────────────────────────
  let _timer = null

  function save(valueToStore) {
    const payload = valueToStore !== undefined ? valueToStore : data.value
    // Write localStorage immediately so cache is always fresh
    localStorage.setItem(lsKey, JSON.stringify(payload))
    // Debounce the Firestore write
    if (_timer) clearTimeout(_timer)
    _timer = setTimeout(() => persistToFirestore(payload), DEBOUNCE_MS)
  }

  async function persistToFirestore(payload) {
    if (MODE === 'dummy') return

    try {
      const { db, doc, setDoc } = await getFs()
      const { auth } = await import('@/services/firebase')
      const userId = auth.currentUser?.uid
      if (!userId) return

      await setDoc(doc(db, 'toolData', docId), {
        userId,
        projectId,
        toolId,
        data: payload,
        updatedAt: new Date().toISOString(),
      })
    } catch {
      // Firestore write failed — data is safe in localStorage
    }
  }

  load()

  return { data, loading, save }
}
