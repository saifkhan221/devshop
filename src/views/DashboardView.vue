<template>
  <AppShell title="Dashboard">
    <template #search>
      <label class="ds-input-wrap">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="ds-input" v-model="search" placeholder="Search projects…" aria-label="Search projects" />
        <kbd class="ds-kbd">/</kbd>
      </label>
    </template>
    <template #actions>
      <button class="ds-btn ds-btn-sm" @click="toggleClockFormat" :title="`Switch to ${is24h ? '12h' : '24h'}`">
        <span class="ds-num">{{ clock }}</span>
      </button>
    </template>

    <!-- ── Page header ────────────────────────────────────────── -->
    <div class="pg-header">
      <div>
        <h1 class="pg-title">Good {{ timeGreeting }}, {{ firstName }}</h1>
        <p class="pg-sub">{{ projects.length }} active project{{ projects.length !== 1 ? 's' : '' }} · {{ totalTools }} tools deployed</p>
      </div>
      <div class="pg-actions">
        <button class="ds-btn" @click="$router.push('/library')">
          <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Library
        </button>
        <button class="ds-btn ds-btn-primary" @click="openNewProjectModal">
          <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          Create project
        </button>
      </div>
    </div>

    <!-- ── KPI row ────────────────────────────────────────────── -->
    <div class="kpi-row">
      <div class="ds-card">
        <div class="ds-stat">
          <div class="stat-top">
            <div class="ds-stat-icon"><svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></div>
            <span class="ds-badge ds-badge-peach"><i class="ds-dot"></i>{{ projects.length ? `${projects.length} active` : 'None yet' }}</span>
          </div>
          <div class="ds-stat-label">Projects</div>
          <div class="ds-stat-row">
            <span class="ds-stat-value">{{ projects.length }}</span>
            <span v-if="createdThisMonth" class="ds-stat-delta ds-stat-delta-up">▲ {{ createdThisMonth }} this month</span>
          </div>
        </div>
      </div>

      <div class="ds-card">
        <div class="ds-stat">
          <div class="stat-top">
            <div class="ds-stat-icon ds-stat-icon-violet"><svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5a4 4 0 0 0 5 5L9 21l-4-4L15.5 6.5z"/><path d="m4 20 1-1"/></svg></div>
            <span class="ds-badge ds-badge-violet">{{ avgTools }} avg / project</span>
          </div>
          <div class="ds-stat-label">Tools deployed</div>
          <div class="ds-stat-row">
            <span class="ds-stat-value">{{ totalTools }}</span>
          </div>
        </div>
      </div>

      <div class="ds-card">
        <div class="ds-stat">
          <div class="stat-top">
            <div class="ds-stat-icon stat-icon-wx"><span>{{ weather.icon || '🌤️' }}</span></div>
            <span class="ds-badge">{{ weather.temp !== null ? `${weather.temp}°C` : '—' }}<span v-if="weather.label" class="wx-label"> · {{ weather.label }}</span></span>
          </div>
          <div class="ds-stat-label">{{ todayFull }}</div>
          <div class="ds-stat-row">
            <span class="ds-stat-value ds-num">{{ clock }}</span>
          </div>
          <div class="wx-loc">
            <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ weather.city || 'Locating…' }}
          </div>
        </div>
      </div>

      <div class="ds-card ds-card-cream quote-card">
        <div class="stat-top">
          <span class="ds-stat-label quote-label">Today's note</span>
          <button class="ds-icon-btn ds-icon-btn-sm quote-refresh" @click="fetchQuote" title="New quote" aria-label="New quote">
            <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
        <p class="quote-text" :class="{ loading: quoteLoading }">{{ quoteLoading ? '…' : (quote.content || '—') }}</p>
        <p class="quote-author">{{ quote.author }}</p>
      </div>
    </div>

    <!-- ── While-you-wait ─────────────────────────────────────── -->
    <WhileYouWait class="wyw-slot" />

    <!-- ── Projects ───────────────────────────────────────────── -->
    <section class="projects">
      <div class="sec-head">
        <h2 class="sec-title">Projects <span class="sec-count">{{ filteredProjects.length }}</span></h2>
        <div class="ds-segmented" role="group" aria-label="Sort projects">
          <button v-for="opt in sortOptions" :key="opt.value" class="ds-seg-item" :aria-pressed="sortBy === opt.value" @click="pickSort(opt.value)">{{ opt.short || opt.label }}</button>
        </div>
      </div>

      <div v-if="filteredProjects.length > 0" class="proj-sections">
        <div v-for="sec in projectSections" :key="sec.key" class="proj-group">
          <div v-if="sec.label" class="quarter-hd">
            <span class="quarter-title">{{ sec.label }}</span>
            <span v-if="sec.months" class="quarter-months">{{ sec.months }}</span>
            <span class="ds-badge">{{ sec.projects.length }}</span>
          </div>
          <div class="proj-grid">
            <article
              v-for="p in sec.projects" :key="p.id"
              class="ds-card ds-card-link proj-card"
              tabindex="0"
              @click="openProject(p.id)"
              @keydown.enter="openProject(p.id)"
            >
              <div class="proj-top">
                <div class="proj-em" :style="{ background: hexToRgba(p.color || '#f5a878', 0.16), color: p.color || 'var(--peach-text)' }">{{ p.emoji || '📁' }}</div>
                <div class="proj-acts">
                  <button class="ds-icon-btn ds-icon-btn-sm" @click.stop="openEditModal(p)" title="Edit" aria-label="Edit project">
                    <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                  </button>
                  <button class="ds-icon-btn ds-icon-btn-sm proj-del" @click.stop="confirmDelete(p)" title="Delete" aria-label="Delete project">
                    <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                  </button>
                </div>
              </div>
              <h3 class="proj-name">{{ p.name }}</h3>
              <p class="proj-desc">{{ p.description || 'No description added' }}</p>
              <div v-if="p.tags?.length" class="proj-tags">
                <span v-for="t in p.tags" :key="t" class="ds-badge ds-badge-violet">{{ t }}</span>
              </div>
              <div class="proj-foot">
                <span class="ds-badge">
                  <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5a4 4 0 0 0 5 5L9 21l-4-4L15.5 6.5z"/></svg>
                  {{ (p.tools || []).length }} tool{{ (p.tools || []).length === 1 ? '' : 's' }}
                </span>
                <span v-if="p.quarter" class="ds-badge ds-badge-peach">{{ shortQuarter(p.quarter) }}</span>
                <span class="proj-date">{{ formatDate(p.createdAt) }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div v-else class="ds-card">
        <div class="ds-empty">
          <div class="ds-empty-art">
            <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div class="ds-empty-title">{{ search ? `No projects match "${search}"` : 'No projects yet' }}</div>
          <div class="ds-empty-body">{{ search ? 'Try another name, or clear the search.' : 'A project groups the tools you use for one piece of work. Create the first one to get started.' }}</div>
          <button v-if="search" class="ds-btn" @click="search = ''">Clear search</button>
          <button v-else class="ds-btn ds-btn-primary" @click="openNewProjectModal">
            <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            Create your first project
          </button>
        </div>
      </div>
    </section>

    <!-- ── New / Edit project modal (shared markup) ────────────── -->
    <AppModal :show="showModal" title="Create project" @close="showModal = false">
      <p class="modal-sub">Name it, pick a colour, optionally file it under a quarter.</p>
      <ProjectForm v-model="newProject" v-model:tagInput="tagInput" v-model:year="npYear" v-model:quarter="npQuarter" :colors="colorOptions" :emojis="emojiOptions" :quarters="QUARTERS" @add-tag="addTag(newProject)" />
      <template #footer>
        <button class="ds-btn" @click="showModal = false">Cancel</button>
        <button class="ds-btn ds-btn-primary" @click="createProject" :disabled="!newProject.name || creating">{{ creating ? 'Creating…' : 'Create project' }}</button>
      </template>
    </AppModal>

    <AppModal :show="showEditModal" title="Edit project" @close="showEditModal = false">
      <ProjectForm v-model="editProject" v-model:tagInput="editTagInput" v-model:year="epYear" v-model:quarter="epQuarter" :colors="colorOptions" :emojis="emojiOptions" :quarters="QUARTERS" @add-tag="addTag(editProject, true)" />
      <template #footer>
        <button class="ds-btn" @click="showEditModal = false">Cancel</button>
        <button class="ds-btn ds-btn-primary" @click="saveEdit" :disabled="!editProject.name || saving">{{ saving ? 'Saving…' : 'Save changes' }}</button>
      </template>
    </AppModal>

    <AppModal :show="showDeleteModal" :title="`Delete “${deleteTarget?.name}”?`" @close="showDeleteModal = false">
      <p class="modal-sub">This removes the project and every tool's saved data in it. It can't be undone.</p>
      <template #footer>
        <button class="ds-btn" @click="showDeleteModal = false">Cancel</button>
        <button class="ds-btn ds-btn-danger" @click="doDelete">Delete project</button>
      </template>
    </AppModal>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { getPrefs, savePrefs } from '@/composables/useUserPrefs'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppModal from '@/components/ui/AppModal.vue'
import WhileYouWait from '@/components/dashboard/WhileYouWait.vue'
import ProjectForm from '@/components/dashboard/ProjectForm.vue'

const store = useStore()
const router = useRouter()

// ─── State ────────────────────────────────────────────────────────
const search        = ref('')
const sortBy        = ref('quarter')
const sortOpen      = ref(false)
const sortDropRef   = ref(null)
const sortOptions   = [
  { value: 'all',     label: 'All projects',     short: 'All'     },
  { value: 'recent',  label: 'Most recent',      short: 'Recent'  },
  { value: 'oldest',  label: 'Oldest first',     short: 'Oldest'  },
  { value: 'quarter', label: 'Group by quarter', short: 'Quarter' },
]
function pickSort(val) { sortBy.value = val; sortOpen.value = false }
function onSortOutside(e) {
  if (sortDropRef.value && !sortDropRef.value.contains(e.target)) sortOpen.value = false
}
const showModal     = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget  = ref(null)
const creating      = ref(false)
const saving        = ref(false)
const tagInput      = ref('')
const editTagInput  = ref('')
const newProject    = ref({ name: '', description: '', color: '#f5a878', emoji: '📁', tags: [] })
const editProject   = ref({ id: null, name: '', description: '', color: '#f5a878', emoji: '📁', tags: [] })

const colorOptions = ['#f5a878', '#a97cf0', '#5fd0e0', '#f07cc0', '#4fd1a1', '#f5c451', '#6fa8ff', '#e6dccf']
const emojiOptions = ['📁', '🛒', '📊', '📱', '🎨', '💻', '🚀', '⚡']

// ─── Quarter picker ───────────────────────────────────────────────
// A project's quarter is stored as a combined string e.g. "2026-Q3".
// Empty / null means the project is not assigned to any quarter.
const QUARTERS = [
  { q: 'Q1', months: 'Jan-Mar' },
  { q: 'Q2', months: 'Apr-Jun' },
  { q: 'Q3', months: 'Jul-Sep' },
  { q: 'Q4', months: 'Oct-Dec' },
]
const Q_MONTHS = { Q1: 'Jan-Mar', Q2: 'Apr-Jun', Q3: 'Jul-Sep', Q4: 'Oct-Dec' }
const currentYear = new Date().getFullYear()

// New-project picker state
const npYear    = ref(currentYear)
const npQuarter = ref('')
// Edit-project picker state
const epYear    = ref(currentYear)
const epQuarter = ref('')

function parseQuarter(val) {
  if (!val || !val.includes('-')) return { year: currentYear, q: '' }
  const [year, q] = val.split('-')
  return { year: Number(year) || currentYear, q: q || '' }
}
// Combined string for storage, or null when no quarter chosen
function composeQuarter(year, q) { return q ? `${year}-${q}` : null }
// Short label for the card chip, e.g. "Q3 '26"
function shortQuarter(val) {
  const { year, q } = parseQuarter(val)
  return q ? `${q} '${String(year).slice(-2)}` : ''
}

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
  const raw  = user?.displayName || user?.name || user?.email || 'Developer'
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
  if (!projects.value.length) return '-'
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

// ─── Quarter grouping ─────────────────────────────────────────────
// Bucket the (already searched) projects by their quarter. Assigned
// quarters come first, newest quarter on top; "Unassigned" sits last.
const groupedProjects = computed(() => {
  const groups = {}
  for (const p of filteredProjects.value) {
    const key = p.quarter || 'unassigned'
    ;(groups[key] ||= []).push(p)
  }
  const assigned = Object.keys(groups)
    .filter(k => k !== 'unassigned')
    .sort((a, b) => b.localeCompare(a))
  const ordered = groups.unassigned ? ['unassigned', ...assigned] : assigned
  return ordered.map(key => {
    if (key === 'unassigned') {
      return { key, label: 'Unassigned', months: '', projects: groups[key] }
    }
    const { year, q } = parseQuarter(key)
    return { key, label: `${q} ${year}`, months: Q_MONTHS[q] || '', projects: groups[key] }
  })
})

// Render sections: one flat section normally, quarter groups when grouping.
const projectSections = computed(() => {
  if (sortBy.value === 'quarter') return groupedProjects.value
  return [{ key: '_all', label: null, months: '', projects: filteredProjects.value }]
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
    } catch { /* denied or timed out - fall through to IP */ }
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

// DEMO: pin this quote on every page load/refresh. The refresh button still
// randomizes. Temporary — remove this pin (restore fetchQuote on mount) later.
const DEMO_QUOTE = { content: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' }
const quote = ref({ ...DEMO_QUOTE })
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
  document.addEventListener('keydown', onSlashKey)
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  fetchWeather()
  // DEMO: quote is pinned to DEMO_QUOTE on load (see above); no initial fetch or
  // auto-refresh so a reload always shows it. The refresh button still randomizes.
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onSortOutside)
  document.removeEventListener('keydown', onSlashKey)
  if (clockTimer) clearInterval(clockTimer)
  if (quoteTimer) clearInterval(quoteTimer)
})

// '/' focuses the topbar search unless something editable already has focus
function onSlashKey(e) {
  if (e.key !== '/' || e.metaKey || e.ctrlKey) return
  const t = e.target
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
  const el = document.querySelector('.ds-topbar .ds-input')
  if (el) { e.preventDefault(); el.focus() }
}

// ─── Actions ──────────────────────────────────────────────────────
function openNewProjectModal() {
  newProject.value = { name: '', description: '', color: '#f5a878', emoji: '📁', tags: [] }
  tagInput.value = ''
  npYear.value    = currentYear
  npQuarter.value = ''
  showModal.value  = true
}

function addTag(target, isEdit = false) {
  const input = isEdit ? editTagInput : tagInput
  const val = input.value.trim()
  if (val && !target.tags.includes(val)) {
    target.tags.push(val)
  }
  input.value = ''
}

async function createProject() {
  if (!newProject.value.name) return
  creating.value   = true
  const project    = await store.dispatch('projects/createProject', {
    ...newProject.value,
    quarter: composeQuarter(npYear.value, npQuarter.value),
    tools: [],
    toolOrder: [],
  })
  creating.value   = false
  showModal.value  = false
  store.dispatch('ui/toast', { message: 'Project created!', type: 'success' })
  router.push(`/project/${project.id}/setup`)
}

function openEditModal(p) {
  editProject.value = {
    id: p.id,
    name: p.name || '',
    description: p.description || '',
    color: p.color || '#f5a878',
    emoji: p.emoji || '📁',
    tags: [...(p.tags || [])],
  }
  const { year, q } = parseQuarter(p.quarter)
  epYear.value    = year
  epQuarter.value = q
  editTagInput.value = ''
  showEditModal.value = true
}

async function saveEdit() {
  if (!editProject.value.name || saving.value) return
  saving.value = true
  const { id, ...data } = editProject.value
  data.quarter = composeQuarter(epYear.value, epQuarter.value)
  await store.dispatch('projects/updateProject', { id, data })
  saving.value = false
  showEditModal.value = false
  store.dispatch('ui/toast', { message: 'Project updated!', type: 'success' })
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
  if (!hex || hex.startsWith('var')) return `rgba(245,168,120,${alpha})`
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
/* Layout tokens only; every colour comes from tokens.css via ds-bundle.css classes. */

// ── Page header ─────────────────────────────────────────────────
.pg-header {
  display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}
.pg-title { margin: 0; font-size: 28px; line-height: 34px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
.pg-sub { margin: var(--space-1) 0 0; font-size: 14px; line-height: 22px; color: var(--ink-muted); }
.pg-actions { display: flex; gap: var(--space-2); }

// ── KPI row ─────────────────────────────────────────────────────
.kpi-row {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); }
.stat-icon-wx { background: var(--warning-soft); color: var(--warning-text); font-size: 18px; }
.wx-label { color: var(--ink-faint); }
.wx-loc { display: inline-flex; align-items: center; gap: var(--space-1); font-size: 12px; line-height: 18px; color: var(--ink-muted); margin-top: var(--space-1); }

.quote-card { display: flex; flex-direction: column; }
.quote-label { color: inherit; opacity: .6; }
.quote-refresh { color: inherit; opacity: .7; &:hover { opacity: 1; background: rgba(0,0,0,.06); } }
.quote-text { margin: var(--space-3) 0 0; font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.005em; flex: 1; &.loading { opacity: .5; } }
.quote-author { margin: var(--space-2) 0 0; font-size: 12px; line-height: 18px; opacity: .65; }

.wyw-slot { margin-bottom: var(--space-8); }

// ── Projects ────────────────────────────────────────────────────
.sec-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
.sec-title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 700; letter-spacing: -0.01em; display: flex; align-items: center; gap: var(--space-2); }
.sec-count { font-size: 13px; font-weight: 600; color: var(--ink-faint); font-variant-numeric: tabular-nums; }

.proj-sections { display: flex; flex-direction: column; gap: var(--space-8); }
.quarter-hd { display: flex; align-items: baseline; gap: var(--space-2); padding-bottom: var(--space-3); margin-bottom: var(--space-4); border-bottom: 1px solid var(--line-soft); }
.quarter-title { font-size: 11px; line-height: 16px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-muted); }
.quarter-months { font-size: 12px; color: var(--ink-faint); }
.quarter-hd .ds-badge { margin-left: auto; }

.proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.proj-card { display: flex; flex-direction: column; gap: var(--space-2); }
.proj-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--space-2); }
.proj-em { width: 44px; height: 44px; border-radius: var(--radius-md); display: grid; place-items: center; font-size: 20px; }
.proj-acts { display: flex; gap: 2px; opacity: 0; transition: opacity 120ms; }
.proj-card:hover .proj-acts, .proj-card:focus-within .proj-acts { opacity: 1; }
.proj-del:hover { color: var(--danger-text); background: var(--danger-soft); }
.proj-name { margin: 0; font-size: 16px; line-height: 24px; font-weight: 700; letter-spacing: -0.005em; }
.proj-desc { margin: 0; font-size: 14px; line-height: 22px; color: var(--ink-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.proj-tags { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.proj-foot { display: flex; align-items: center; gap: var(--space-2); margin-top: auto; padding-top: var(--space-3); border-top: 1px solid var(--line-soft); }
.proj-date { margin-left: auto; font-size: 12px; color: var(--ink-faint); font-variant-numeric: tabular-nums; }

.modal-sub { margin: 0 0 var(--space-4); color: var(--ink-muted); }

// ── Responsive ──────────────────────────────────────────────────
@media (max-width: 1279px) { .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 767px) {
  .kpi-row { grid-template-columns: 1fr; }
  .pg-title { font-size: 24px; line-height: 30px; }
  .pg-actions .ds-btn:not(.ds-btn-primary) { display: none; }
}
</style>
