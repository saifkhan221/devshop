<template>
  <div class="news">
    <!-- Category chips -->
    <div class="news-cats">
      <button
        v-for="c in categories" :key="c.key"
        class="news-cat"
        :class="{ active: activeCat === c.key }"
        @click="selectCat(c.key)"
      >{{ c.label }}</button>
    </div>

    <!-- Location line -->
    <div class="news-loc">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span>{{ locLabel }}</span>
    </div>

    <!-- States -->
    <div v-if="loading" class="news-state">
      <span class="news-spinner"></span> Loading headlines…
    </div>
    <div v-else-if="error" class="news-state news-state--err">
      Couldn't load news right now.
      <button class="news-retry" @click="load">Retry</button>
    </div>
    <div v-else-if="!items.length" class="news-state">No stories found.</div>

    <!-- Feed -->
    <div v-else class="news-feed">
      <a
        v-for="(n, i) in items" :key="i"
        :href="n.link" target="_blank" rel="noopener noreferrer"
        class="nf-item" :class="{ 'nf-item--lead': i === 0 }"
      >
        <span class="nf-avatar" :style="{ background: sourceColor(n.source) }">{{ sourceInitial(n.source) }}</span>
        <span class="nf-body">
          <span class="nf-title">{{ n.title }}</span>
          <span class="nf-meta">
            <span class="nf-source">{{ prettySource(n.source) }}</span>
            <template v-if="n.ago"><span class="nf-dot">·</span>{{ n.ago }}</template>
          </span>
        </span>
        <svg class="nf-ext" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loc = ref({ cc: 'US', city: '' })
const activeCat = ref('top')
const items = ref([])
const loading = ref(true)
const error = ref(false)

const categories = ref([
  { key: 'top',    label: 'Top' },
  { key: 'local',  label: 'Local' },
  { key: 'business',      label: 'Business' },
  { key: 'technology',    label: 'Technology' },
  { key: 'finance',       label: 'Finance' },
  { key: 'sports',        label: 'Sports' },
  { key: 'science',       label: 'Science' },
  { key: 'health',        label: 'Health' },
  { key: 'entertainment', label: 'Entertainment' },
])

const locLabel = ref('Locating…')

function ceid() {
  const cc = loc.value.cc || 'US'
  return `hl=en-${cc}&gl=${cc}&ceid=${cc}:en`
}

function rssUrl() {
  // Same-origin proxy path (Vite dev proxy + Vercel rewrite -> news.google.com).
  // Topic-section feeds now 302-redirect, so categories use the search endpoint,
  // which returns region-aware results reliably.
  const base = '/gnews/rss'
  if (activeCat.value === 'top') return `${base}?${ceid()}`
  const q = activeCat.value === 'local'
    ? (loc.value.city || loc.value.cc)
    : activeCat.value
  return `${base}/search?q=${encodeURIComponent(q)}&${ceid()}`
}

function prettySource(s) {
  if (!s) return 'News'
  let d = s.replace(/^https?:\/\//, '').replace(/^www\./, '')
  // Bare domain (e.g. "timesofindia.indiatimes.com") -> capitalized first label
  if (/\.[a-z]{2,}$/i.test(d) && !d.includes(' ')) {
    d = d.split('.')[0]
    return d.charAt(0).toUpperCase() + d.slice(1)
  }
  return s
}
function sourceInitial(s) { return (prettySource(s).trim()[0] || 'N').toUpperCase() }
function sourceColor(s) {
  const str = prettySource(s)
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue},58%,48%), hsl(${(hue + 40) % 360},58%,42%))`
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return ''
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

async function detectLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const j = await res.json()
    loc.value = { cc: j.country_code || 'US', city: j.city || '' }
    locLabel.value = [j.city, j.country_name].filter(Boolean).join(', ') || 'Your region'
  } catch {
    loc.value = { cc: 'US', city: '' }
    locLabel.value = 'Default region'
  }
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const res = await fetch(rssUrl())
    const text = await res.text()
    const xml = new DOMParser().parseFromString(text, 'text/xml')
    const nodes = [...xml.querySelectorAll('item')].slice(0, 18)
    items.value = nodes.map(node => {
      const rawTitle = node.querySelector('title')?.textContent || ''
      const source = node.querySelector('source')?.textContent || ''
      // Google News appends " - Source" to titles; trim it when redundant
      const title = source && rawTitle.endsWith(` - ${source}`)
        ? rawTitle.slice(0, -(source.length + 3))
        : rawTitle
      return {
        title,
        link: node.querySelector('link')?.textContent || '#',
        source: source || 'News',
        ago: timeAgo(node.querySelector('pubDate')?.textContent),
      }
    })
    if (!items.value.length) error.value = true
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function selectCat(key) {
  if (activeCat.value === key) return
  activeCat.value = key
  load()
}

onMounted(async () => {
  await detectLocation()
  load()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.news { display: flex; flex-direction: column; gap: 14px; min-height: 320px; }

.news-cats { display: flex; flex-wrap: wrap; gap: 7px; }
.news-cat {
  padding: 6px 13px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: $text-heading; }
  &.active { background: var(--accent-subtle); border-color: $brand-500; color: var(--accent); }
}

.news-loc {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: $brand-400;
  svg { color: var(--accent); }
}

.news-state {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  padding: 48px 0; color: $brand-400; font-size: 13px;
  &--err { flex-direction: column; }
}
.news-retry {
  margin-top: 8px; padding: 6px 16px;
  background: var(--accent-subtle); border: 1px solid $brand-500; border-radius: $radius-md;
  color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer;
}
.news-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(124,58,237,.3); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.news-feed {
  display: flex; flex-direction: column;
  max-height: 440px; overflow-y: auto;
  margin: 0 -6px;
  padding: 0 6px;
}

.nf-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 13px 12px;
  border-radius: 12px;
  border-bottom: 1px solid var(--border-subtle);
  text-decoration: none;
  transition: background 0.12s;
  &:last-child { border-bottom: none; }
  &:hover { background: $bg-elevated; .nf-ext { opacity: 1; } }
}

.nf-avatar {
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,.3);
}

.nf-body { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
.nf-title {
  font-size: 14px; font-weight: 600; color: $text-heading; line-height: 1.45;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.nf-meta { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: $brand-400; }
.nf-source { font-weight: 600; color: $brand-300; }
.nf-dot { opacity: 0.6; }
.nf-ext { color: $brand-400; opacity: 0; flex-shrink: 0; margin-top: 3px; transition: opacity 0.15s; }

// Featured lead story - same row structure, just emphasized
.nf-item--lead {
  background: linear-gradient(135deg, var(--accent-subtle), rgba(34,211,238,.04));
  border: 1px solid rgba(124,58,237,.22);
  border-radius: 14px;
  margin-bottom: 10px;
  padding: 16px;
  .nf-avatar { width: 38px; height: 38px; font-size: 16px; }
  .nf-title { font-size: 16.5px; font-weight: 700; letter-spacing: -0.2px; -webkit-line-clamp: 3; }
  .nf-meta { font-size: 12px; }
}
</style>
