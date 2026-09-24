<template>
  <div class="library-page" @dragenter="onDragEnter" @dragover.prevent @dragleave="onDragLeave" @drop="onDrop">
    <AppNavbar :showUsername="false">
      <template #right>
        <button class="nav-back" @click="$router.push('/dashboard')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Dashboard
        </button>
      </template>
    </AppNavbar>

    <main class="lib-main">
      <!-- Header -->
      <div class="lib-header">
        <div>
          <h1 class="lib-title">Library</h1>
          <p class="lib-sub">Shared prompts, skills &amp; docs. Anyone on the team can add and copy.</p>
        </div>
        <div class="lib-header-actions">
          <button class="btn-import" @click="triggerImport">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import .md
          </button>
          <button class="btn-new" @click="openCreate">+ New Entry</button>
        </div>
      </div>
      <input ref="fileInput" type="file" accept=".md,.markdown,.txt" multiple style="display:none" @change="onFileImport" />

      <!-- Toolbar: type filter + search -->
      <div class="lib-toolbar">
        <div class="type-tabs">
          <button
            v-for="t in TYPE_FILTERS" :key="t.value"
            class="type-tab"
            :class="{ active: activeType === t.value }"
            @click="activeType = t.value"
          >
            <span class="tt-icon">{{ t.icon }}</span>{{ t.label }}
            <span class="tt-count">{{ countByType(t.value) }}</span>
          </button>
        </div>
        <div class="srch">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="search" placeholder="Search title, tags, content…" />
        </div>
      </div>

      <!-- List -->
      <div v-if="loading" class="lib-loading">Loading…</div>

      <div v-else-if="filtered.length === 0" class="lib-empty">
        <div class="lib-empty-icon">📚</div>
        <div class="lib-empty-title">{{ search || activeType !== 'all' ? 'Nothing matches' : 'The library is empty' }}</div>
        <div class="lib-empty-sub">{{ search || activeType !== 'all' ? 'Try a different filter or search.' : 'Add the first prompt, skill or doc for the team.' }}</div>
        <button v-if="!search && activeType === 'all'" class="btn-new" style="margin-top:18px" @click="openCreate">+ New Entry</button>
      </div>

      <div v-else class="lib-grid">
        <article v-for="e in filtered" :key="e.id" class="lib-card" @click="openReader(e)">
          <div class="lc-top">
            <span class="lc-type" :class="'lc-type--' + e.type">{{ typeMeta(e.type).icon }} {{ typeMeta(e.type).label }}</span>
            <button class="lc-download" @click.stop="downloadEntry(e)" title="Download as .md">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          </div>
          <h3 class="lc-title">{{ e.title }}</h3>
          <div class="lc-foot">
            <span class="lc-author-name">{{ authorLabel(e) }}</span>
            <span class="lc-date">{{ formatDate(e.updatedAt || e.createdAt) }}</span>
          </div>
        </article>
      </div>
    </main>

    <!-- ── Reader ─────────────────────────────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="reader" class="lib-overlay" @click.self="reader = null">
          <div class="lib-dialog lib-dialog--reader">
            <div class="ld-head">
              <div class="ld-head-l">
                <span class="lc-type" :class="'lc-type--' + reader.type">{{ typeMeta(reader.type).icon }} {{ typeMeta(reader.type).label }}</span>
                <h2 class="ld-title">{{ reader.title }}</h2>
              </div>
              <button class="ld-close" @click="reader = null">✕</button>
            </div>
            <div class="ld-meta">
              <span class="lc-avatar">{{ (reader.authorName || '?')[0].toUpperCase() }}</span>
              {{ authorLabel(reader) }} · {{ formatDate(reader.updatedAt || reader.createdAt) }}
            </div>
            <div v-if="reader.tags?.length" class="lc-tags" style="margin-bottom:16px">
              <span v-for="t in reader.tags" :key="t" class="lc-tag">{{ t }}</span>
            </div>
            <div class="ld-body md-body" v-html="renderFull(reader.body)"></div>
            <div class="ld-foot">
              <div class="ld-foot-l">
                <button class="btn-copy-lg" @click="copyEntry(reader)">
                  {{ copiedId === reader.id ? '✓ Copied' : '📋 Copy content' }}
                </button>
                <button class="btn-download" @click="downloadEntry(reader)" title="Download as .md">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download .md
                </button>
              </div>
              <div v-if="canEdit(reader)" class="ld-foot-r">
                <button class="btn-ghost" @click="openEdit(reader)">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- ── Editor ─────────────────────────────────────────────────── -->
    <teleport to="body">
      <transition name="modal">
        <div v-if="editorOpen" class="lib-overlay" @click.self="editorOpen = false">
          <div class="lib-dialog lib-dialog--editor">
            <div class="ld-head">
              <h2 class="ld-title">{{ editing.id ? 'Edit entry' : 'New entry' }}</h2>
              <button class="ld-close" @click="editorOpen = false">✕</button>
            </div>

            <div class="ed-row">
              <div class="fg fg-title">
                <label>Title</label>
                <input v-model="editing.title" placeholder="e.g. Vue component-from-Figma prompt" maxlength="140" />
              </div>
              <div class="fg fg-type">
                <label>Type</label>
                <div class="type-seg">
                  <button
                    v-for="t in TYPES" :key="t.value"
                    type="button"
                    class="type-seg-btn"
                    :class="{ active: editing.type === t.value }"
                    @click="editing.type = t.value"
                  >{{ t.icon }} {{ t.label }}</button>
                </div>
              </div>
            </div>

            <div class="fg">
              <label>Tags <span class="opt">(optional)</span></label>
              <div class="tag-row">
                <span v-for="t in editing.tags" :key="t" class="tag-pill">
                  {{ t }} <button class="tag-rm" @click="editing.tags = editing.tags.filter(x => x !== t)">&times;</button>
                </span>
                <input
                  class="tag-input"
                  v-model="tagInput"
                  placeholder="Add tag + Enter"
                  @keydown.enter.prevent="addTag"
                />
              </div>
            </div>

            <div class="fg">
              <div class="ed-body-head">
                <label>Content <span class="opt">(Markdown)</span></label>
                <div class="ed-tabs">
                  <button type="button" :class="{ active: !showPreview }" @click="showPreview = false">Write</button>
                  <button type="button" :class="{ active: showPreview }" @click="showPreview = true">Preview</button>
                </div>
              </div>
              <textarea
                v-if="!showPreview"
                v-model="editing.body"
                class="ed-textarea"
                rows="14"
                placeholder="# Heading&#10;&#10;Write your prompt, skill or doc in Markdown…"
              ></textarea>
              <div v-else class="ed-preview md-body" v-html="renderFull(editing.body || '_Nothing to preview yet._')"></div>
            </div>

            <div class="ld-foot">
              <button class="btn-ghost" @click="editorOpen = false">Cancel</button>
              <button class="btn-primary" @click="saveEntry" :disabled="!editing.title.trim() || !editing.body.trim() || saving">
                <span v-if="saving" class="spinner"></span>
                <span v-else>{{ editing.id ? 'Save changes' : 'Add to library' }}</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>

    <!-- ── Drop overlay ─────────────────────────────────────────── -->
    <transition name="fade">
      <div v-if="dragging" class="drop-overlay">
        <div class="drop-zone">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div class="drop-text">Drop .md files here</div>
          <div class="drop-sub">Supports .md, .markdown, .txt</div>
        </div>
      </div>
    </transition>

    <!-- ── Delete confirm ─────────────────────────────────────────── -->
    <AppModal :show="!!deleteTarget" title="Delete entry?" @close="deleteTarget = null">
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:8px">
        Delete <strong style="color:#fff">{{ deleteTarget?.title }}</strong> from the shared library? This can't be undone.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="deleteTarget = null">Cancel</button>
        <button class="btn-danger" @click="doDelete" :disabled="deleting">Delete</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { dbService } from '@/services/db'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppModal from '@/components/ui/AppModal.vue'

const ADMIN_EMAIL = 'saif@radix.email'

const TYPES = [
  { value: 'prompt',  label: 'Prompt',   icon: '💬' },
  { value: 'skill',   label: 'Skill',    icon: '🧩' },
  { value: 'general', label: 'General',  icon: '📄' },
  { value: 'md',      label: 'Markdown', icon: '📝' },
]
const TYPE_FILTERS = [{ value: 'all', label: 'All', icon: '📚' }, ...TYPES]

const store = useStore()
const user = computed(() => store.getters['auth/currentUser'])
const isAdmin = computed(() => user.value?.email === ADMIN_EMAIL)

function typeMeta(v) { return TYPES.find(t => t.value === v) || TYPES[2] }

// ─── Markdown ──────────────────────────────────────────────────────
marked.setOptions({ breaks: true, gfm: true })
function renderFull(md) { return DOMPurify.sanitize(marked.parse(md || '')) }
function plainExcerpt(md) {
  if (!md) return ''
  return md
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/---/g, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
    .slice(0, 180)
}

// ─── List / load ───────────────────────────────────────────────────
const entries = ref([])
const loading = ref(true)
const search = ref('')
const activeType = ref('all')

async function load() {
  loading.value = true
  try {
    entries.value = await dbService.getLibraryEntries(
      { uid: user.value?.uid, email: user.value?.email },
      (fresh) => { entries.value = fresh },
    )
  } catch {
    entries.value = []
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  let list = entries.value
  if (activeType.value !== 'all') list = list.filter(e => e.type === activeType.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.body?.toLowerCase().includes(q) ||
      (e.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }
  return list
})

function countByType(v) {
  if (v === 'all') return entries.value.length
  return entries.value.filter(e => e.type === v).length
}

function canEdit(e) { return e.authorId === user.value?.uid || isAdmin.value }
function authorLabel(e) {
  const name = (e.authorName || 'Someone').split('@')[0]
  return e.authorId === user.value?.uid ? `${name} (you)` : name
}

// ─── Reader ────────────────────────────────────────────────────────
const reader = ref(null)
function openReader(e) { reader.value = e }

// ─── Copy ──────────────────────────────────────────────────────────
const copiedId = ref(null)
async function copyEntry(e) {
  try {
    await navigator.clipboard.writeText(e.body || '')
    copiedId.value = e.id
    store.dispatch('ui/toast', { message: 'Copied to clipboard', type: 'success' })
    setTimeout(() => { if (copiedId.value === e.id) copiedId.value = null }, 1800)
  } catch {
    store.dispatch('ui/toast', { message: 'Could not copy', type: 'error' })
  }
}

// ─── Download as .md ───────────────────────────────────────────────
function slugify(s) {
  return (s || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'untitled'
}
function downloadEntry(e) {
  const blob = new Blob([e.body || ''], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(e.title)}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  store.dispatch('ui/toast', { message: 'Downloaded .md file', type: 'success' })
}

// ─── Editor ────────────────────────────────────────────────────────
const editorOpen = ref(false)
const saving = ref(false)
const showPreview = ref(false)
const tagInput = ref('')
const blankEntry = () => ({ id: null, title: '', type: 'prompt', tags: [], body: '' })
const editing = ref(blankEntry())

function openCreate() {
  editing.value = blankEntry()
  tagInput.value = ''
  showPreview.value = false
  editorOpen.value = true
}

// ─── Import .md ───────────────────────────────────────────────────
const fileInput = ref(null)
function triggerImport() { fileInput.value?.click() }

function parseMarkdownFile(content, filename) {
  const lines = content.split('\n')
  let title = ''
  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#{1,2}\s+(.+)/)
    if (m) {
      title = m[1].trim()
      bodyStart = i + 1
      break
    }
  }
  if (!title) {
    title = filename.replace(/\.(md|markdown|txt)$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
  }
  let body = lines.slice(bodyStart).join('\n').replace(/^\n+/, '').trimEnd()
  if (!body) body = content.trim()
  return { title, body }
}

async function processImportedFiles(files) {
  if (files.length === 1) {
    const content = await files[0].text()
    const { title, body } = parseMarkdownFile(content, files[0].name)
    editing.value = { id: null, title, type: 'md', tags: [], body }
    tagInput.value = ''
    showPreview.value = false
    editorOpen.value = true
    store.dispatch('ui/toast', { message: `Imported "${files[0].name}"`, type: 'success' })
    return
  }

  let count = 0
  for (const file of files) {
    const content = await file.text()
    const { title, body } = parseMarkdownFile(content, file.name)
    try {
      const item = await dbService.createLibraryEntry(user.value.uid, {
        title, type: 'md', tags: [], body,
        authorName: user.value.email || user.value.name || 'Unknown',
      })
      entries.value = [item, ...entries.value]
      count++
    } catch { /* skip failed */ }
  }
  if (count) {
    store.dispatch('ui/toast', { message: `Imported ${count} file${count > 1 ? 's' : ''} to library`, type: 'success' })
  }
}

function onFileImport(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  e.target.value = ''
  processImportedFiles(files)
}

// ─── Drag & drop ──────────────────────────────────────────────────
const dragCounter = ref(0)
const dragging = computed(() => dragCounter.value > 0)

function onDragEnter(e) {
  e.preventDefault()
  dragCounter.value++
}
function onDragLeave(e) {
  e.preventDefault()
  dragCounter.value--
}
function onDrop(e) {
  e.preventDefault()
  dragCounter.value = 0
  const files = Array.from(e.dataTransfer?.files || []).filter(f =>
    /\.(md|markdown|txt)$/i.test(f.name)
  )
  if (!files.length) {
    store.dispatch('ui/toast', { message: 'Only .md, .markdown and .txt files supported', type: 'error' })
    return
  }
  processImportedFiles(files)
}

function openEdit(e) {
  reader.value = null
  editing.value = { id: e.id, title: e.title, type: e.type, tags: [...(e.tags || [])], body: e.body }
  tagInput.value = ''
  showPreview.value = false
  editorOpen.value = true
}

function addTag() {
  const v = tagInput.value.trim()
  if (v && !editing.value.tags.includes(v)) editing.value.tags.push(v)
  tagInput.value = ''
}

async function saveEntry() {
  if (!editing.value.title.trim() || !editing.value.body.trim() || saving.value) return
  saving.value = true
  const data = {
    title: editing.value.title.trim(),
    type: editing.value.type,
    tags: editing.value.tags,
    body: editing.value.body.trim(),
  }
  try {
    if (editing.value.id) {
      await dbService.updateLibraryEntry(editing.value.id, data)
      const idx = entries.value.findIndex(e => e.id === editing.value.id)
      if (idx !== -1) entries.value[idx] = { ...entries.value[idx], ...data, updatedAt: new Date().toISOString() }
      store.dispatch('ui/toast', { message: 'Entry updated', type: 'success' })
    } else {
      const item = await dbService.createLibraryEntry(user.value.uid, {
        ...data,
        authorName: user.value.email || user.value.name || 'Unknown',
      })
      entries.value = [item, ...entries.value]
      store.dispatch('ui/toast', { message: 'Added to library', type: 'success' })
    }
    editorOpen.value = false
  } catch {
    store.dispatch('ui/toast', { message: 'Failed to save', type: 'error' })
  } finally {
    saving.value = false
  }
}

// ─── Delete ────────────────────────────────────────────────────────
const deleteTarget = ref(null)
const deleting = ref(false)
function confirmDelete(e) { deleteTarget.value = e }
async function doDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  const id = deleteTarget.value.id
  try {
    await dbService.deleteLibraryEntry(id)
    entries.value = entries.value.filter(e => e.id !== id)
    if (reader.value?.id === id) reader.value = null
    store.dispatch('ui/toast', { message: 'Entry deleted', type: 'info' })
    deleteTarget.value = null
  } catch {
    store.dispatch('ui/toast', { message: 'Failed to delete', type: 'error' })
  } finally {
    deleting.value = false
  }
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return ''
  const date = d?.toDate ? d.toDate() : d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(load)
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.library-page { min-height: 100vh; background: $bg-primary; }

.lib-main {
  padding: 32px 32px 80px;
  max-width: 1180px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

// ── Header ──────────────────────────────────────────────────────────
.lib-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.lib-title { font-size: 26px; font-weight: 700; color: $text-heading; letter-spacing: -0.5px; line-height: 1.2; }
.lib-sub { font-size: 13px; color: $brand-400; margin-top: 4px; }

.nav-back {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: $text-heading; }
}

.btn-new {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px var(--accent-glow);
  white-space: nowrap;
  &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px var(--accent-glow); }
}

.lib-header-actions { display: flex; gap: 10px; align-items: center; }

.btn-import {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-1px); }
}

// ── Toolbar ─────────────────────────────────────────────────────────
.lib-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.type-tabs { display: flex; gap: 8px; flex-wrap: wrap; }

.type-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 13px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  transition: all 0.15s;
  .tt-icon { font-size: 13px; }
  &:hover { border-color: var(--accent); color: $text-heading; }
  &.active { background: var(--accent-subtle); border-color: $brand-500; color: var(--accent); }
}
.tt-count {
  font-size: 10px; font-weight: 700;
  background: $bg-elevated;
  padding: 1px 7px;
  border-radius: 10px;
  color: $brand-400;
}
.type-tab.active .tt-count { background: rgba(124,58,237,.18); color: var(--accent); }

.srch {
  position: relative;
  svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: $brand-400; }
  input {
    background: $bg-surface;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    padding: 8px 14px 8px 34px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; color: #fff;
    outline: none;
    width: 260px;
    transition: border-color 0.2s;
    &:focus { border-color: var(--accent); }
    &::placeholder { color: rgba(167,139,250,.4); }
  }
}

// ── States ──────────────────────────────────────────────────────────
.lib-loading { text-align: center; color: $brand-400; font-size: 13px; padding: 48px 0; }

.lib-empty {
  text-align: center; padding: 56px 20px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
}
.lib-empty-icon { font-size: 38px; margin-bottom: 10px; }
.lib-empty-title { font-size: 16px; font-weight: 600; color: $text-heading; margin-bottom: 4px; }
.lib-empty-sub { font-size: 12px; color: $brand-400; }

// ── Grid / Cards ────────────────────────────────────────────────────
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.lib-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 20px 22px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s;
  &:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,0,0,.25);
  }
}

.lc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

.lc-download {
  width: 30px; height: 30px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: $brand-400;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-subtle); }
}
.lib-card:hover .lc-download { opacity: 1; }

.lc-type {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px; font-weight: 600;
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid rgba(124,58,237,.15);
  white-space: nowrap;
  width: fit-content;
  &--skill   { background: rgba(16,185,129,.12); color: #10b981; border-color: rgba(16,185,129,.2); }
  &--general { background: rgba(59,130,246,.12); color: #3b82f6; border-color: rgba(59,130,246,.2); }
  &--md      { background: rgba(245,158,11,.12); color: #f59e0b; border-color: rgba(245,158,11,.2); }
}

.lc-title {
  font-size: 15px; font-weight: 700; color: $text-heading;
  letter-spacing: -0.2px; line-height: 1.35;
}

.lc-excerpt {
  font-size: 13px;
  color: $brand-400;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.lc-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.lc-author-name {
  font-size: 11px; color: $brand-400;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.lc-date { font-size: 11px; color: $text-muted; white-space: nowrap; }

// ── Shared (reader + cards) ────────────────────────────────────────
.lc-avatar {
  width: 20px; height: 20px; flex-shrink: 0;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 600; color: #fff;
}
.lc-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.lc-tag {
  padding: 2px 9px;
  border-radius: 10px;
  font-size: 10px; font-weight: 500;
  background: $bg-elevated;
  color: $brand-300;
  border: 1px solid var(--border-subtle);
}

// ── Overlay dialogs (reader + editor) ───────────────────────────────
.lib-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(5px);
  z-index: 120;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 48px 20px;
  overflow-y: auto;
}

.lib-dialog {
  background: $bg-surface;
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  padding: 32px 36px;
  width: 100%;
  box-shadow: 0 24px 70px rgba(0,0,0,.5);
  &--reader { max-width: 720px; }
  &--editor { max-width: 780px; padding: 26px 28px; }
}

.ld-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.ld-head-l { display: flex; flex-direction: column; gap: 12px; }
.ld-title { font-size: 24px; font-weight: 800; color: $text-heading; letter-spacing: -0.5px; line-height: 1.25; }
.ld-close {
  width: 32px; height: 32px; flex-shrink: 0;
  background: $bg-elevated; border: none; border-radius: 8px;
  color: $brand-300; font-size: 15px; cursor: pointer;
  transition: all 0.15s;
  &:hover { background: $brand-700; color: #fff; }
}
.ld-meta {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: $brand-400;
  margin-bottom: 18px;
}

.ld-body {
  margin-bottom: 28px;
  padding-top: 22px;
  border-top: 1px solid var(--border-subtle);
}

.ld-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px;
  padding-top: 18px;
  border-top: 1px solid var(--border-subtle);
}
.ld-foot-l { display: flex; gap: 10px; align-items: center; }
.ld-foot-r { display: flex; gap: 10px; }

.btn-copy-lg {
  padding: 9px 18px;
  background: var(--accent-subtle);
  border: 1px solid $brand-500;
  border-radius: $radius-md;
  color: var(--accent);
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(124,58,237,.2); }
}

.btn-download {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 16px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: var(--accent); }
}

// ── Editor form ─────────────────────────────────────────────────────
.ed-row { display: flex; gap: 14px; }
.fg { margin-bottom: 16px; flex: 1;
  label { display: block; font-size: 12px; font-weight: 500; color: $brand-300; margin-bottom: 6px; }
  input, textarea {
    width: 100%;
    background: $bg-elevated;
    border: 1px solid var(--border-strong);
    border-radius: $radius-md;
    padding: 10px 13px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; color: #fff;
    outline: none;
    transition: border-color 0.2s;
    &:focus { border-color: $brand-500; }
    &::placeholder { color: rgba(167,139,250,.35); }
  }
}
.fg-title { flex: 2; }
.fg-type { flex: 3; }
.opt { color: $brand-600; font-size: 11px; }

.type-seg { display: flex; gap: 6px; flex-wrap: wrap; }
.type-seg-btn {
  flex: 1;
  padding: 9px 6px;
  background: $bg-elevated;
  border: 1px solid var(--border-strong);
  border-radius: $radius-md;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover { border-color: $brand-500; }
  &.active { background: var(--accent-subtle); border-color: var(--accent); color: var(--accent); }
}

.tag-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.tag-pill {
  display: flex; align-items: center; gap: 3px;
  padding: 5px 11px;
  border-radius: 14px;
  font-size: 12px; font-weight: 500;
  background: var(--accent-subtle);
  color: var(--accent);
}
.tag-rm { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 14px; line-height: 1; padding: 0; opacity: .6; &:hover { opacity: 1; } }
.tag-input { width: 160px; }

.ed-body-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.ed-tabs {
  display: flex; gap: 4px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 3px;
  button {
    padding: 4px 12px;
    background: transparent; border: none; border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 500;
    color: $brand-400; cursor: pointer;
    transition: all 0.15s;
    &.active { background: $brand-600; color: #fff; }
  }
}
.ed-textarea { resize: vertical; min-height: 200px; font-family: 'JetBrains Mono', ui-monospace, monospace !important; font-size: 12.5px !important; line-height: 1.6; }
.ed-preview {
  min-height: 200px;
  background: $bg-elevated;
  border: 1px solid var(--border-strong);
  border-radius: $radius-md;
  padding: 14px 16px;
}

.btn-ghost {
  padding: 9px 18px;
  background: $bg-elevated;
  border: none; border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: $brand-700; color: #fff; }
}
.btn-primary {
  padding: 9px 20px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none; border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
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
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { background: rgba(239,68,68,.25); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

// ── Drop overlay ───────────────────────────────────────────────────
.drop-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.7);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.drop-zone {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px 64px;
  border: 2px dashed var(--accent);
  border-radius: 24px;
  background: rgba(124,58,237,.08);
  svg { color: var(--accent); }
}
.drop-text { font-size: 18px; font-weight: 700; color: $text-heading; letter-spacing: -0.3px; }
.drop-sub { font-size: 13px; color: $brand-400; }

// ── Responsive ──────────────────────────────────────────────────────
@media (max-width: 620px) {
  .lib-grid { grid-template-columns: 1fr; }
  .ed-row { flex-direction: column; gap: 0; }
  .srch input { width: 100%; }
  .srch { flex: 1; }
  .lib-header { flex-direction: column; align-items: flex-start; }
}
</style>

<!-- Rendered-markdown styling - not scoped so v-html content is styled -->
<style lang="scss">
@use '@/styles/variables' as *;

.md-body {
  color: $text-secondary;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;

  h1, h2, h3, h4 {
    color: $text-heading; font-weight: 700; line-height: 1.35;
    margin: 1.9em 0 0.7em; letter-spacing: -0.2px;
  }
  h1 { font-size: 18px; }
  h2 { font-size: 16px; }
  h3 { font-size: 14px; }
  h4 { font-size: 13px; }
  p { margin: 0 0 1.15em; }
  a { color: var(--accent); text-decoration: none; border-bottom: 1px solid rgba(124,58,237,.35); }
  a:hover { border-bottom-color: var(--accent); }
  strong { color: $text-heading; font-weight: 600; }
  em { font-style: italic; }

  // Tailwind's Preflight resets list-style to none globally, so re-enable
  // markers explicitly or ordered lists render with no numbers (look plain).
  ul, ol { margin: 0 0 1.15em; padding-left: 1.5em; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  li { margin-bottom: 0.6em; padding-left: 0.25em; }
  li:last-child { margin-bottom: 0; }
  li::marker { color: $brand-500; }
  ul ul, ol ol, ul ol, ol ul { margin: 0.6em 0; }

  code {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 0.85em;
    background: rgba(255,255,255,.06);
    color: $text-heading;
    padding: 2px 6px;
    border-radius: 5px;
  }
  pre {
    background: $bg-primary;
    border: 1px solid var(--border-subtle);
    border-radius: 10px;
    padding: 16px 18px;
    overflow-x: auto;
    margin: 1.3em 0;
    line-height: 1.65;
    code { background: none; color: $text-secondary; padding: 0; font-size: 0.9em; }
  }

  blockquote {
    border-left: 3px solid $brand-500;
    margin: 1.3em 0;
    padding: 4px 0 4px 16px;
    color: $brand-300;
  }

  hr { border: none; border-top: 1px solid var(--border-subtle); margin: 2em 0; }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.3em 0;
    font-size: 13px;
  }
  th, td { border: 1px solid var(--border-subtle); padding: 8px 12px; text-align: left; }
  th { background: $bg-elevated; color: $text-heading; font-weight: 600; }

  img { max-width: 100%; border-radius: 8px; }

  > :first-child { margin-top: 0; }
  > :last-child { margin-bottom: 0; }
}
</style>
