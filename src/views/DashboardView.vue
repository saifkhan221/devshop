<template>
  <div class="dashboard">
    <AppNavbar />

    <main class="main">

      <!-- ── Page Header ───────────────────────────────────────────── -->
      <div class="pg-header">
        <div>
          <h1 class="pg-title">Good {{ timeGreeting }}, <span class="title-hl">{{ firstName }}</span> 👋</h1>
          <p class="pg-sub">{{ projects.length }} active project{{ projects.length !== 1 ? 's' : '' }} &middot; {{ totalTools }} tools deployed</p>
        </div>
        <div class="pg-right">
          <div class="srch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="search" placeholder="Search projects…" />
          </div>
          <button class="btn-new" @click="openNewProjectModal">+ New Project</button>
        </div>
      </div>

      <!-- ── KPI Cards ─────────────────────────────────────────────── -->
      <div class="kpi-row">
        <!-- Regular cards -->
        <div v-for="k in kpiList" :key="k.key" class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon" :style="{ background: k.iconBg }">{{ k.icon }}</div>
            <span class="kpi-badge" :style="{ background: k.badgeBg, color: k.badgeColor }">{{ k.badge }}</span>
          </div>
          <div class="kpi-val">{{ k.value }}</div>
          <div class="kpi-lbl">{{ k.label }}</div>
        </div>

        <!-- Date / Time / Weather card -->
        <div class="kpi-card kpi-card--weather">
          <div class="kpi-top">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="kpi-icon" style="background:rgba(245,158,11,.12)">
                <span v-if="weather.icon">{{ weather.icon }}</span>
                <span v-else>🌤️</span>
              </div>
              <span v-if="weather.label" class="wx-condition-label">{{ weather.label }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="clock-toggle" @click="toggleClockFormat" :title="`Switch to ${is24h ? '12h' : '24h'}`">
                {{ is24h ? '24h' : '12h' }}
              </button>
              <span class="kpi-badge" style="background:rgba(245,158,11,.12);color:#f59e0b">
                {{ weather.temp !== null ? weather.temp + '°C' : 'Weather' }}
              </span>
            </div>
          </div>
          <div class="wx-time">{{ clock }}</div>
          <div class="wx-date">{{ todayFull }}</div>
          <div class="wx-location">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ weather.city || 'Locating…' }}
          </div>
        </div>

        <!-- Motivational quote card -->
        <div class="kpi-card kpi-card--quote">
          <div class="kpi-top">
            <div class="kpi-icon" style="background:rgba(59,130,246,.12)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
              </svg>
            </div>
            <button class="quote-refresh" @click="fetchQuote" title="New quote">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
          <div class="quote-text" :class="{ loading: quoteLoading }">
            {{ quoteLoading ? '…' : (quote.content || '—') }}
          </div>
          <div class="quote-author">— {{ quote.author || '' }}</div>
        </div>
      </div>

      <!-- ── Projects ─────────────────────────────────────────────── -->
      <div class="projects-section">
        <div class="proj-section-hd">
          <div class="card-title">Projects</div>

          <!-- Custom sort dropdown -->
          <div class="sort-drop" ref="sortDropRef">
            <button class="sort-trigger" @click="sortOpen = !sortOpen">
              <span>{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
              <svg class="sort-caret" :class="{ open: sortOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <transition name="drop">
              <div v-if="sortOpen" class="sort-panel">
                <button
                  v-for="opt in sortOptions" :key="opt.value"
                  class="sort-opt"
                  :class="{ active: sortBy === opt.value }"
                  @click="pickSort(opt.value)"
                >
                  <svg v-if="sortBy === opt.value" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span v-else class="sort-opt-spacer"></span>
                  {{ opt.label }}
                </button>
              </div>
            </transition>
          </div>
        </div>

        <div v-if="filteredProjects.length > 0" class="proj-grid">
          <div
            v-for="p in filteredProjects" :key="p.id"
            class="proj-card"
            @click="openProject(p.id)"
          >
            <div class="proj-topbar" :style="{ background: `linear-gradient(90deg, ${p.color || '#7c3aed'}, ${lighten(p.color || '#7c3aed')})` }"></div>
            <div class="proj-body">
              <div class="proj-row1">
                <div class="proj-em" :style="{ background: hexToRgba(p.color || '#7c3aed', 0.14) }">{{ p.emoji || '📁' }}</div>
                <div class="proj-acts">
                  <button class="pact" @click.stop="openProject(p.id)" title="Open">↗</button>
                  <button class="pact pact-del" @click.stop="confirmDelete(p)" title="Delete">🗑</button>
                </div>
              </div>
              <div class="proj-name">{{ p.name }}</div>
              <div class="proj-desc">{{ p.description || 'No description added' }}</div>
              <div class="proj-foot">
                <span class="pt-badge">🔧 {{ (p.tools || []).length }}</span>
                <span class="pt-date">{{ formatDate(p.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="proj-empty">
          <div class="pe-icon">📂</div>
          <div class="pe-title">{{ search ? 'No results found' : 'No projects yet' }}</div>
          <div class="pe-sub">{{ search ? 'Try a different search term' : 'Create your first project to get started' }}</div>
          <button v-if="!search" class="btn-new" style="margin-top:18px" @click="openNewProjectModal">+ New Project</button>
        </div>
      </div>

    </main>

    <!-- ── New Project Modal ─────────────────────────────────────── -->
    <AppModal :show="showModal" title="Create New Project" @close="showModal = false">
      <p class="modal-sub">Give your project a name and pick a colour.</p>
      <div class="form-group">
        <label>Project Name</label>
        <input type="text" v-model="newProject.name" placeholder="e.g. Landing Page Redesign" />
      </div>
      <div class="form-group">
        <label>Description <span class="opt">(optional)</span></label>
        <textarea v-model="newProject.description" rows="3" placeholder="What are you building?"></textarea>
      </div>
      <div class="form-group">
        <label>Accent Colour</label>
        <div class="color-row">
          <div
            v-for="c in colorOptions" :key="c"
            class="color-dot"
            :class="{ selected: newProject.color === c }"
            :style="{ background: c }"
            @click="newProject.color = c"
          ></div>
        </div>
      </div>
      <div class="form-group">
        <label>Emoji</label>
        <div class="emoji-row">
          <div
            v-for="e in emojiOptions" :key="e"
            class="emoji-opt"
            :class="{ selected: newProject.emoji === e }"
            @click="newProject.emoji = e"
          >{{ e }}</div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showModal = false">Cancel</button>
        <button class="btn-primary" @click="createProject" :disabled="!newProject.name || creating">
          <span v-if="creating" class="spinner"></span>
          <span v-else>Create Project →</span>
        </button>
      </template>
    </AppModal>

    <!-- ── Delete Modal ──────────────────────────────────────────── -->
    <AppModal :show="showDeleteModal" title="Delete Project?" @close="showDeleteModal = false">
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">
        Are you sure you want to delete <strong style="color:#fff">{{ deleteTarget?.name }}</strong>? This cannot be undone.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="showDeleteModal = false">Cancel</button>
        <button class="btn-danger" @click="doDelete">Delete</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { getPrefs, savePrefs } from '@/composables/useUserPrefs'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppModal from '@/components/ui/AppModal.vue'

const store = useStore()
const router = useRouter()

// ─── State ────────────────────────────────────────────────────────
const search        = ref('')
const sortBy        = ref('all')
const sortOpen      = ref(false)
const sortDropRef   = ref(null)
const sortOptions   = [
  { value: 'all',    label: 'All Projects' },
  { value: 'recent', label: 'Most Recent'  },
  { value: 'oldest', label: 'Oldest First' },
]
function pickSort(val) { sortBy.value = val; sortOpen.value = false }
function onSortOutside(e) {
  if (sortDropRef.value && !sortDropRef.value.contains(e.target)) sortOpen.value = false
}
const showModal     = ref(false)
const showDeleteModal = ref(false)
const deleteTarget  = ref(null)
const creating      = ref(false)
const newProject    = ref({ name: '', description: '', color: '#7c3aed', emoji: '📁' })

const colorOptions = ['#7c3aed', '#059669', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#06b6d4', '#a855f7']
const emojiOptions = ['📁', '🛒', '📊', '📱', '🎨', '💻', '🚀', '⚡']

// ─── Store ────────────────────────────────────────────────────────
const projects   = computed(() => store.getters['projects/allProjects'])
const totalTools = computed(() => projects.value.reduce((sum, p) => sum + (p.tools || []).length, 0))

// ─── Greeting ─────────────────────────────────────────────────────
const timeGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const firstName = computed(() => {
  const user = store.getters['auth/currentUser']
  const raw  = user?.name || user?.email || 'Developer'
  return raw.split('@')[0].split(' ')[0]
})

// ─── KPI Cards ────────────────────────────────────────────────────

const createdThisMonth = computed(() => {
  const now  = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()
  return projects.value.filter(p => {
    if (!p.createdAt) return false
    const d = new Date(p.createdAt)
    return d.getMonth() === month && d.getFullYear() === year
  }).length
})

const avgTools = computed(() => {
  if (!projects.value.length) return '—'
  return (totalTools.value / projects.value.length).toFixed(1)
})

const kpiList = computed(() => {
  const pc = projects.value.length
  const tc = totalTools.value
  return [
    {
      key: 'projects',
      icon: '📁',
      value: pc,
      label: 'Total Projects',
      badge: pc > 0 ? `${pc} active` : 'None',
      iconBg: 'var(--accent-subtle)',
      badgeBg: 'var(--accent-subtle)',
      badgeColor: 'var(--accent)',
    },
    {
      key: 'tools',
      icon: '🔧',
      value: tc,
      label: 'Tools Deployed',
      badge: tc > 0 ? `${tc} active` : 'None',
      iconBg: 'rgba(16,185,129,.12)',
      badgeBg: 'rgba(16,185,129,.12)',
      badgeColor: '#10b981',
    },
  ]
})

// ─── Filtered / Sorted Projects ───────────────────────────────────
const filteredProjects = computed(() => {
  let list = [...projects.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q))
  }
  if (sortBy.value === 'recent') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (sortBy.value === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  return list
})

// ─── Clock ────────────────────────────────────────────────────────
const clock = ref('')
const todayFull = ref('')
const is24h = ref(getPrefs().clock24h !== false)
let clockTimer = null

function toggleClockFormat() {
  is24h.value = !is24h.value
  savePrefs({ clock24h: is24h.value })
  tickClock()
}

function tickClock() {
  const now = new Date()
  clock.value = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24h.value,
  })
  todayFull.value = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
}

// ─── Weather ──────────────────────────────────────────────────────
const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'🌨️', 75:'❄️',
  80:'🌦️', 81:'🌧️', 82:'⛈️',
  95:'⛈️', 96:'⛈️', 99:'⛈️',
}

const WMO_LABELS = {
  0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
  45:'Foggy', 48:'Foggy',
  51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
  61:'Light rain', 63:'Rain', 65:'Heavy rain',
  71:'Light snow', 73:'Snow', 75:'Heavy snow',
  80:'Showers', 81:'Heavy showers', 82:'Violent showers',
  95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm',
}

const weather = ref({ temp: null, icon: '', city: '', label: '' })

async function getCoords() {
  // 1. Try browser geolocation first (precise, needs permission)
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      )
      return { lat: pos.coords.latitude, lon: pos.coords.longitude, source: 'gps' }
    } catch { /* denied or timed out — fall through to IP */ }
  }
  // 2. Fall back to IP-based location (no permission needed)
  const ipRes = await fetch('https://ipapi.co/json/')
  const ipJson = await ipRes.json()
  if (ipJson.latitude) {
    return { lat: ipJson.latitude, lon: ipJson.longitude, city: ipJson.city, source: 'ip' }
  }
  throw new Error('no location')
}

async function fetchWeather() {
  try {
    const coords = await getCoords()
    let city = coords.city || ''

    if (!city) {
      // Reverse geocode only when GPS was used (IP fallback already has city)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`)
      const geoJson = await geoRes.json()
      city = geoJson.address?.city || geoJson.address?.town || geoJson.address?.village || geoJson.address?.county || 'Your location'
    }
    weather.value.city = city

    // Fetch weather
    const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code`)
    const wxJson = await wxRes.json()
    const code = wxJson.current?.weather_code
    weather.value.temp = Math.round(wxJson.current?.temperature_2m ?? 0)
    weather.value.icon = WMO_ICONS[code] ?? '🌡️'
    weather.value.label = WMO_LABELS[code] ?? 'Unknown'
  } catch {
    weather.value.city = 'Location unavailable'
  }
}

// ─── Quote ────────────────────────────────────────────────────────
const FALLBACK_QUOTES = [
  { content: 'Great things are done by a series of small things brought together.', author: 'Vincent Van Gogh' },
  { content: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { content: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
  { content: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { content: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { content: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
  { content: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { content: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { content: 'Strive not to be a success, but rather to be of value.', author: 'Albert Einstein' },
]

const quote = ref({ content: '', author: '' })
const quoteLoading = ref(false)
let quoteTimer = null

async function fetchQuote() {
  quoteLoading.value = true
  try {
    // Updated quotable.io endpoint
    const res = await fetch('https://api.quotable.io/quotes/random?tags=inspirational|motivational&maxLength=80', { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('API error')
    const json = await res.json()
    const q = Array.isArray(json) ? json[0] : json
    if (q?.content) {
      quote.value = { content: q.content, author: q.author }
    } else throw new Error('empty')
  } catch {
    // Pick a random fallback quote
    const idx = Math.floor(Math.random() * FALLBACK_QUOTES.length)
    quote.value = FALLBACK_QUOTES[idx]
  } finally {
    quoteLoading.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────
onMounted(async () => {
  if (projects.value.length === 0) {
    await store.dispatch('projects/fetchProjects')
  }
  document.addEventListener('mousedown', onSortOutside)
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  fetchWeather()
  fetchQuote()
  // Auto-refresh quote every 30 mins
  quoteTimer = setInterval(fetchQuote, 30 * 60 * 1000)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onSortOutside)
  if (clockTimer) clearInterval(clockTimer)
  if (quoteTimer) clearInterval(quoteTimer)
})

// ─── Actions ──────────────────────────────────────────────────────
function openNewProjectModal() {
  newProject.value = { name: '', description: '', color: '#7c3aed', emoji: '📁' }
  showModal.value  = true
}

async function createProject() {
  if (!newProject.value.name) return
  creating.value   = true
  const project    = await store.dispatch('projects/createProject', { ...newProject.value, tools: [], toolOrder: [] })
  creating.value   = false
  showModal.value  = false
  store.dispatch('ui/toast', { message: 'Project created!', type: 'success' })
  router.push(`/project/${project.id}/setup`)
}

function openProject(id) { router.push(`/project/${id}`) }

function confirmDelete(project) {
  deleteTarget.value  = project
  showDeleteModal.value = true
}

async function doDelete() {
  await store.dispatch('projects/deleteProject', deleteTarget.value.id)
  showDeleteModal.value = false
  store.dispatch('ui/toast', { message: 'Project deleted', type: 'info' })
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return ''
  // Firestore Timestamp → plain Date
  const date = d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function hexToRgba(hex, alpha) {
  if (!hex || hex.startsWith('var')) return `rgba(124,58,237,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function lighten(hex) {
  if (!hex || hex.startsWith('var')) return '#a78bfa'
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 80)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 80)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 80)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

// ── Layout ──────────────────────────────────────────────────────────
.dashboard { min-height: 100vh; background: $bg-primary; }

.main {
  padding: 32px 32px 80px;
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

// ── Page Header ─────────────────────────────────────────────────────
.pg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.pg-title {
  font-size: 26px;
  font-weight: 700;
  color: $text-heading;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.title-hl { color: var(--accent); }

.pg-sub {
  font-size: 13px;
  color: $brand-400;
  margin-top: 4px;
}

.pg-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.srch {
  position: relative;
  svg {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: $brand-400;
  }
  input {
    background: $bg-surface;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: 8px 14px 8px 34px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #fff;
    outline: none;
    width: 220px;
    transition: border-color 0.2s;
    &:focus { border-color: var(--accent); }
    &::placeholder { color: rgba(167,139,250,.4); }
  }
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px var(--accent-glow);
  white-space: nowrap;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px var(--accent-glow); }
}

// ── KPI Row ─────────────────────────────────────────────────────────
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.kpi-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px 24px 20px;
  position: relative;
  overflow: hidden;
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.kpi-icon {
  width: 48px; height: 48px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.kpi-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.02em;
}

.kpi-val {
  font-size: 34px;
  font-weight: 800;
  color: $text-heading;
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 6px;
}

.kpi-lbl {
  font-size: 13px;
  color: $brand-400;
}

// ── Clock format toggle ──────────────────────────────────────────────
.clock-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 3px 0;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #f59e0b;
  font-variant-numeric: tabular-nums;
  &:hover { border-color: #f59e0b; }
}

// ── Weather card ──────────────────────────────────────────────────────
.wx-time {
  font-size: 34px;
  font-weight: 800;
  color: $text-heading;
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
}
.wx-date {
  font-size: 13px;
  font-weight: 500;
  color: $brand-300;
  margin-bottom: 6px;
}
.wx-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $brand-400;
  svg { flex-shrink: 0; }
}
.wx-condition-label { font-size: 11px; color: $brand-400; }

// ── Quote card ──────────────────────────────────────────────────────
.quote-refresh {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: $brand-400;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  outline: none;
  &:focus { outline: none; box-shadow: none; }
  &:hover { border-color: var(--accent); color: var(--accent); }
}

.quote-text {
  font-size: 13px;
  font-weight: 500;
  color: $text-heading;
  line-height: 1.55;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  &.loading { color: $brand-500; font-style: italic; }
}

.quote-author {
  font-size: 11px;
  color: $brand-400;
  font-style: italic;
}

// ── Card Base ───────────────────────────────────────────────────────
.card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 22px;
  transition: border-color 0.2s;
}

.card-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: $text-heading;
  letter-spacing: -0.2px;
}

.card-sub {
  font-size: 12px;
  color: $brand-400;
  margin-top: 2px;
}

.chip {
  font-size: 11px;
  font-weight: 500;
  color: $brand-400;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 4px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

// ── Projects Section (open, no container) ───────────────────────────
.projects-section { width: 100%; }

.proj-section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

// ── Custom sort dropdown ─────────────────────────────────────────────
.sort-drop {
  position: relative;
}

.sort-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  white-space: nowrap;
  &:hover {
    border-color: var(--accent);
    color: $text-heading;
  }
}

.sort-caret {
  color: $brand-400;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  &.open { transform: rotate(180deg); }
}

.sort-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.35);
  z-index: 100;
}

.sort-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  &:hover {
    background: $bg-elevated;
    color: $text-heading;
  }
  &.active {
    color: var(--accent);
    svg { color: var(--accent); }
  }
}

.sort-opt-spacer { width: 12px; flex-shrink: 0; }

// Dropdown open/close animation
.drop-enter-active, .drop-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

.proj-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.proj-card {
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  &:hover {
    border-color: var(--accent);
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(0,0,0,.35);
    .proj-acts { opacity: 1; }
  }
}

.proj-topbar {
  height: 4px;
  width: 100%;
  flex-shrink: 0;
}

.proj-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.proj-row1 {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.proj-em {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}

.proj-acts {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.pact {
  width: 28px; height: 28px;
  background: $bg-surface;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  color: $brand-400;
  transition: all 0.2s;
  &:hover { background: $brand-700; color: #fff; }
  &.pact-del:hover { background: rgba(239,68,68,.2); color: #f87171; }
}

.proj-name {
  font-size: 15px;
  font-weight: 700;
  color: $text-heading;
  margin-bottom: 8px;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.proj-desc {
  font-size: 12px;
  color: $text-secondary;
  line-height: 1.5;
  margin-bottom: 0;
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.proj-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.pt-badge {
  font-size: 11px;
  font-weight: 500;
  color: $brand-300;
  background: $bg-surface;
  padding: 4px 9px;
  border-radius: 20px;
}

.pt-date { font-size: 11px; color: $text-muted; }

.proj-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.pe-icon  { font-size: 40px; margin-bottom: 12px; }
.pe-title { font-size: 16px; font-weight: 600; color: $text-heading; margin-bottom: 6px; }
.pe-sub   { font-size: 12px; color: $brand-400; }


// ── Modal Forms ──────────────────────────────────────────────────────
.modal-sub { font-size: 13px; color: $brand-400; margin-bottom: 20px; }

.form-group {
  margin-bottom: 16px;
  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: $brand-300;
    margin-bottom: 6px;
  }
  input, textarea {
    width: 100%;
    background: $bg-elevated;
    border: 1px solid var(--border-strong);
    border-radius: $radius-md;
    padding: 10px 13px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #fff;
    outline: none;
    transition: border-color 0.2s;
    resize: vertical;
    &:focus { border-color: $brand-500; }
    &::placeholder { color: rgba(167,139,250,.35); }
  }
}

.opt { color: $brand-600; font-size: 11px; }

.color-row { display: flex; gap: 8px; flex-wrap: wrap; }
.color-dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
  &.selected, &:hover { border-color: #fff; transform: scale(1.15); }
}

.emoji-row { display: flex; gap: 8px; }
.emoji-opt {
  width: 36px; height: 36px;
  border-radius: $radius-sm;
  background: $bg-elevated;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
  &.selected, &:hover { border-color: $brand-500; background: var(--accent-subtle); }
}

.btn-ghost {
  padding: 9px 18px;
  background: $bg-elevated;
  border: none;
  border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: $brand-700; color: #fff; }
}

.btn-primary {
  padding: 9px 20px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 10px var(--accent-glow);
  display: flex; align-items: center; gap: 6px;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px var(--accent-glow); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.btn-danger {
  padding: 9px 18px;
  background: rgba(239,68,68,.15);
  border: 1px solid rgba(239,68,68,.3);
  border-radius: $radius-md;
  color: #f87171;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(239,68,68,.25); }
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
