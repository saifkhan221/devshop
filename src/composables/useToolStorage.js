/**
 * useToolStorage — per-tool data persistence
 *
 * Dummy mode  → localStorage (key: devshop_tool_{projectId}_{toolId})
 * Firebase mode → Firestore collection "toolData", doc "{projectId}_{toolId}"
 *
 * Usage:
 *   const { data, loading, save } = useToolStorage(projectId, 'kanban', defaultValue)
 *
 *   // Mutate data.value freely, then call save(valueToStore) to persist.
 *   // save() is debounced 800ms so rapid changes get batched automatically.
 */

import { ref } from 'vue'

const MODE = import.meta.env.VITE_AUTH_MODE
const DEBOUNCE_MS = 800

// ─── Firestore module cache (same pattern as db.js) ───────────────────────
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
    if (MODE === 'dummy') {
      const raw = localStorage.getItem(lsKey)
      if (raw) {
        try { data.value = JSON.parse(raw) } catch { /* corrupt — use default */ }
      }
      loading.value = false
      return
    }

    try {
      const { db, doc, getDoc } = await getFs()
      const snap = await getDoc(doc(db, 'toolData', docId))
      if (snap.exists() && snap.data().data !== undefined) {
        data.value = snap.data().data
      }
    } catch {
      // Firestore unavailable — silently fall through with default value
    } finally {
      loading.value = false
    }
  }

  // ─── Save (debounced) ──────────────────────────────────────────────────
  let _timer = null

  function save(valueToStore) {
    const payload = valueToStore !== undefined ? valueToStore : data.value
    if (_timer) clearTimeout(_timer)
    _timer = setTimeout(() => persist(payload), DEBOUNCE_MS)
  }

  async function persist(payload) {
    if (MODE === 'dummy') {
      localStorage.setItem(lsKey, JSON.stringify(payload))
      return
    }

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
      // Save failed silently — data stays in memory, user work not lost
    }
  }

  load()

  return { data, loading, save }
}
