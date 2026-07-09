/**
 * useUserPrefs — user-level preferences synced to Firestore
 *
 * Stores: theme, customTheme, clock24h — anything that belongs to the user
 * not a specific project/tool.
 *
 * Same stale-while-revalidate pattern as useToolStorage:
 *   Load: localStorage (instant) → Firestore background refresh
 *   Save: localStorage immediately → Firestore debounced 800ms
 */

const MODE        = import.meta.env.VITE_AUTH_MODE
const STORAGE_KEY = 'devshop_user_prefs'
const DEBOUNCE_MS = 800
const DOC_PATH    = 'userPrefs'   // collection name

const DEFAULTS = {
  theme:       'aurora',
  customTheme: null,   // { accent, bg } or null
  clock24h:    true,
}

// ─── Firestore cache ──────────────────────────────────────────────────────
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

function read() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) } } catch { return { ...DEFAULTS } }
}

function writeLocal(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

// ─── Debounced Firestore write ────────────────────────────────────────────
let _timer = null

async function persistToFirestore(prefs) {
  if (MODE === 'dummy') return
  try {
    const { db, doc, setDoc } = await getFs()
    const { auth } = await import('@/services/firebase')
    const userId = auth.currentUser?.uid
    if (!userId) return
    await setDoc(doc(db, DOC_PATH, userId), { ...prefs, updatedAt: new Date().toISOString() })
  } catch (e) {
    console.error('[useUserPrefs] Firestore write failed', e)
  }
}

function scheduleSave(prefs) {
  writeLocal(prefs)
  if (_timer) clearTimeout(_timer)
  _timer = setTimeout(() => persistToFirestore(prefs), DEBOUNCE_MS)
}

// ─── Background fetch from Firestore ─────────────────────────────────────
export async function syncPrefsFromFirestore() {
  if (MODE === 'dummy') return null
  try {
    const { db, doc, getDoc } = await getFs()
    const { auth } = await import('@/services/firebase')
    const userId = auth.currentUser?.uid
    if (!userId) return null
    const snap = await getDoc(doc(db, DOC_PATH, userId))
    if (!snap.exists()) return null
    const remote = snap.data()
    const merged = { ...DEFAULTS, ...remote }
    writeLocal(merged)
    return merged
  } catch { return null }
}

// ─── Public API ───────────────────────────────────────────────────────────
export function getPrefs() {
  return read()
}

export function savePrefs(patch) {
  const current = read()
  const updated = { ...current, ...patch }
  scheduleSave(updated)
  return updated
}
