<template>
  <div class="admin-page">
    <AppNavbar :showUsername="false">
      <template #right>
        <button class="nav-back" @click="$router.push('/dashboard')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Dashboard
        </button>
      </template>
    </AppNavbar>

    <main class="adm-main">
      <div class="adm-header">
        <div>
          <h1 class="adm-title">Dev Log</h1>
          <p class="adm-sub">Track development sessions, token usage & commits</p>
        </div>
        <button class="btn-add" @click="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Entry' }}
        </button>
      </div>

      <!-- Add Entry Form -->
      <transition name="slide">
        <section v-if="showForm" class="adm-form-card">
          <div class="adm-form-grid">
            <div class="fg">
              <label>Feature</label>
              <input type="text" v-model="form.feature" placeholder="e.g. Feedback system" />
            </div>
            <div class="fg">
              <label>Tokens Used</label>
              <input type="text" v-model="form.tokens" placeholder="e.g. ~150k" />
            </div>
            <div class="fg">
              <label>Model</label>
              <select v-model="form.model">
                <option v-for="m in MODELS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div class="fg">
              <label>Commit Message</label>
              <input type="text" v-model="form.commit" placeholder="e.g. Add feedback feature" />
            </div>
          </div>
          <button class="btn-submit" @click="addEntry" :disabled="!form.feature.trim() || submitting">
            <span v-if="submitting" class="spinner"></span>
            <span v-else>Add to Log</span>
          </button>
        </section>
      </transition>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-val">{{ entries.length }}</div>
          <div class="stat-lbl">Sessions</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ totalTokens }}</div>
          <div class="stat-lbl">Total Tokens</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">{{ topModel }}</div>
          <div class="stat-lbl">Primary Model</div>
        </div>
      </div>

      <!-- Entries Table -->
      <section class="adm-table-section">
        <div v-if="loading" class="adm-loading">Loading...</div>

        <div v-else-if="entries.length === 0" class="adm-empty">
          <div class="adm-empty-icon">📋</div>
          <div class="adm-empty-title">No entries yet</div>
          <div class="adm-empty-sub">Add your first dev log entry above</div>
        </div>

        <div v-else class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Tokens</th>
                <th>Model</th>
                <th>Commit</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in entries" :key="e.id">
                <td class="td-feature">{{ e.feature }}</td>
                <td class="td-tokens">{{ e.tokens }}</td>
                <td><span class="model-badge">{{ e.model }}</span></td>
                <td class="td-commit">{{ e.commit }}</td>
                <td class="td-date">{{ formatDate(e.createdAt) }}</td>
                <td>
                  <button class="td-delete" @click="deleteEntry(e)" :disabled="deleting === e.id" title="Delete">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { dbService } from '@/services/db'
import AppNavbar from '@/components/layout/AppNavbar.vue'

const ADMIN_EMAIL = 'saif@radix.email'
const MODELS = ['Claude Opus 4', 'Claude Sonnet 4', 'Claude Haiku 4', 'Claude Opus 3.5', 'Claude Sonnet 3.5']

const store = useStore()
const router = useRouter()
const user = computed(() => store.getters['auth/currentUser'])

onMounted(() => {
  if (user.value?.email !== ADMIN_EMAIL) {
    router.replace('/dashboard')
    return
  }
  loadEntries()
})

const showForm = ref(false)
const submitting = ref(false)
const loading = ref(true)
const deleting = ref(null)
const entries = ref([])
const form = ref({ feature: '', tokens: '', model: 'Claude Opus 4', commit: '' })

const totalTokens = computed(() => {
  let sum = 0
  entries.value.forEach(e => {
    const num = parseFloat((e.tokens || '').replace(/[^0-9.]/g, ''))
    if (!num) return
    const str = (e.tokens || '').toLowerCase()
    if (str.includes('m')) sum += num * 1000000
    else if (str.includes('k')) sum += num * 1000
    else sum += num
  })
  if (sum >= 1000000) return (sum / 1000000).toFixed(1) + 'M'
  if (sum >= 1000) return Math.round(sum / 1000) + 'k'
  return sum || '—'
})

const topModel = computed(() => {
  if (!entries.value.length) return '—'
  const counts = {}
  entries.value.forEach(e => { counts[e.model] = (counts[e.model] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
})

async function loadEntries() {
  loading.value = true
  try {
    entries.value = await dbService.getDevLog()
  } catch { entries.value = [] }
  finally { loading.value = false }
}

async function addEntry() {
  if (!form.value.feature.trim() || submitting.value) return
  submitting.value = true
  try {
    await dbService.addDevLogEntry({
      feature: form.value.feature.trim(),
      tokens: form.value.tokens.trim(),
      model: form.value.model,
      commit: form.value.commit.trim(),
    })
    form.value = { feature: '', tokens: '', model: 'Claude Opus 4', commit: '' }
    showForm.value = false
    await loadEntries()
  } finally { submitting.value = false }
}

async function deleteEntry(e) {
  if (deleting.value) return
  deleting.value = e.id
  try {
    await dbService.deleteDevLogEntry(e.id)
    entries.value = entries.value.filter(x => x.id !== e.id)
  } finally { deleting.value = null }
}

function formatDate(d) {
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.admin-page { min-height: 100vh; background: $bg-primary; }

.adm-main {
  padding: 32px 32px 80px;
  max-width: 960px;
  margin: 0 auto;
  display: flex; flex-direction: column; gap: 22px;
}

.adm-header {
  display: flex; align-items: center;
  justify-content: space-between; gap: 16px;
}

.adm-title {
  font-size: 26px; font-weight: 700; color: $text-heading;
  letter-spacing: -0.5px; line-height: 1.2;
}
.adm-sub { font-size: 13px; color: $brand-400; margin-top: 4px; }

.nav-back {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300; cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: $text-heading; }
}

.btn-add {
  padding: 9px 18px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none; border-radius: $radius-md;
  color: #fff; font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 4px 14px var(--accent-glow);
  white-space: nowrap;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px var(--accent-glow); }
}

// ── Form ────────────────────────────────────────────────────────────
.adm-form-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 16px; padding: 24px;
}

.adm-form-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px; margin-bottom: 16px;
}

.fg {
  label {
    display: block; font-size: 11px; font-weight: 500;
    color: $brand-300; margin-bottom: 5px; letter-spacing: 0.02em;
  }
  input, select {
    width: 100%;
    background: $bg-elevated;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: 9px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; color: #fff; outline: none;
    transition: border-color 0.2s;
    &:focus { border-color: $brand-500; }
    &::placeholder { color: rgba(167,139,250,.35); }
  }
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23a78bfa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
    cursor: pointer;
  }
}

.btn-submit {
  padding: 9px 20px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none; border-radius: $radius-md;
  color: #fff; font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 10px var(--accent-glow);
  display: flex; align-items: center; gap: 6px;
  &:hover:not(:disabled) { transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

// ── Stats ───────────────────────────────────────────────────────────
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

.stat-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 14px; padding: 20px;
  text-align: center;
}
.stat-val {
  font-size: 28px; font-weight: 800; color: $text-heading;
  letter-spacing: -0.5px; line-height: 1; margin-bottom: 6px;
}
.stat-lbl { font-size: 12px; color: $brand-400; }

// ── Table ───────────────────────────────────────────────────────────
.adm-table-section { width: 100%; }

.adm-loading { text-align: center; color: $brand-400; font-size: 13px; padding: 40px 0; }

.adm-empty {
  text-align: center; padding: 48px 20px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
}
.adm-empty-icon { font-size: 36px; margin-bottom: 10px; }
.adm-empty-title { font-size: 15px; font-weight: 600; color: $text-heading; margin-bottom: 4px; }
.adm-empty-sub { font-size: 12px; color: $brand-400; }

.adm-table-wrap {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  overflow-x: auto;
}

.adm-table {
  width: 100%; border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    padding: 14px 16px;
    font-size: 11px; font-weight: 600;
    color: $brand-400; letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-subtle);
    white-space: nowrap;
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-subtle);
    color: $text-secondary;
    vertical-align: middle;
  }

  tbody tr:last-child td { border-bottom: none; }
  tbody tr { transition: background 0.12s; }
  tbody tr:hover { background: rgba(124,58,237,.03); }
}

.td-feature { color: $text-heading; font-weight: 600; }
.td-tokens { color: #10b981; font-weight: 600; font-variant-numeric: tabular-nums; }
.td-commit {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px; color: $brand-300;
  max-width: 220px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.td-date { color: $text-muted; white-space: nowrap; font-size: 12px; }

.model-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px; font-weight: 500;
  background: var(--accent-subtle);
  color: var(--accent);
  white-space: nowrap;
}

.td-delete {
  width: 28px; height: 28px;
  background: transparent;
  border: 1px solid rgba(239,68,68,.2);
  border-radius: 7px;
  color: $brand-400; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &:hover { background: rgba(239,68,68,.1); color: #f87171; border-color: rgba(239,68,68,.4); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// ── Transitions ─────────────────────────────────────────────────────
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
