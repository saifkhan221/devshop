<template>
  <AppShell title="Library">
    <template #search>
      <label class="ds-input-wrap">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input class="ds-input" v-model="search" placeholder="Search title, tags, content…" aria-label="Search library" />
      </label>
    </template>
    <template #actions>
      <button class="ds-btn ds-btn-sm" @click="triggerImport">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
        Import .md
      </button>
    </template>

    <div @dragenter="onDragEnter" @dragover.prevent @dragleave="onDragLeave" @drop="onDrop">
      <!-- ── Page header ────────────────────────────────────────── -->
      <div class="pg-header">
        <div>
          <h1 class="pg-title">Library</h1>
          <p class="pg-sub">Shared prompts, skills and docs. Anyone on the team can add and copy.</p>
        </div>
        <div class="pg-actions">
          <button class="ds-btn ds-btn-primary" @click="openCreate">
            <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            New entry
          </button>
        </div>
      </div>
      <input ref="fileInput" type="file" accept=".md,.markdown,.txt" multiple style="display:none" @change="onFileImport" />

      <!-- ── Type filter ────────────────────────────────────────── -->
      <div class="ds-tabs lib-tabs" role="tablist" aria-label="Filter by type">
        <button
          v-for="t in TYPE_FILTERS" :key="t.value"
          class="ds-tab"
          :class="{ 'is-active': activeType === t.value }"
          :aria-selected="activeType === t.value"
          @click="activeType = t.value"
        >
          {{ t.label }}<span class="ds-badge">{{ countByType(t.value) }}</span>
        </button>
      </div>

      <!-- ── States ─────────────────────────────────────────────── -->
      <p v-if="loading" class="ds-muted lib-loading">Loading…</p>

      <div v-else-if="filtered.length === 0" class="ds-empty">
        <div class="ds-empty-art">
          <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div class="ds-empty-title">{{ search || activeType !== 'all' ? 'Nothing matches' : 'The library is empty' }}</div>
        <p class="ds-empty-body">{{ search || activeType !== 'all' ? 'Try a different filter or clear your search.' : 'Add the first prompt, skill or doc for the team.' }}</p>
        <button v-if="!search && activeType === 'all'" class="ds-btn ds-btn-primary" @click="openCreate">
          <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          New entry
        </button>
      </div>

      <!-- ── Grid ───────────────────────────────────────────────── -->
      <div v-else class="lib-grid">
        <article
          v-for="e in filtered" :key="e.id"
          class="ds-card ds-card-link lib-card"
          tabindex="0"
          @click="openReader(e)"
          @keydown.enter="openReader(e)"
        >
          <div class="lc-top">
            <span class="ds-badge ds-badge-violet">{{ typeMeta(e.type).label }}</span>
            <div class="lc-acts">
              <button class="ds-icon-btn ds-icon-btn-sm" @click.stop="downloadEntry(e)" title="Download as .md" aria-label="Download as .md">
                <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
              </button>
              <template v-if="canEdit(e)">
                <button class="ds-icon-btn ds-icon-btn-sm" @click.stop="openEdit(e)" title="Edit" aria-label="Edit entry">
                  <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                </button>
                <button class="ds-icon-btn ds-icon-btn-sm lc-del" @click.stop="confirmDelete(e)" title="Delete" aria-label="Delete entry">
                  <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                </button>
              </template>
            </div>
          </div>
          <h3 class="lc-title">{{ e.title }}</h3>
          <div class="lc-foot">
            <span class="ds-cell-meta">{{ authorLabel(e) }}</span>
            <span class="ds-cell-meta">{{ formatDate(e.updatedAt || e.createdAt) }}</span>
          </div>
        </article>
      </div>
    </div>

    <!-- ── Reader ─────────────────────────────────────────────── -->
    <AppModal :show="!!reader" :title="reader?.title" @close="reader = null">
      <div v-if="reader" class="rd">
        <div class="rd-meta">
          <span class="ds-badge ds-badge-violet">{{ typeMeta(reader.type).label }}</span>
          <span class="ds-avatar ds-avatar-sm ds-avatar-peach">{{ (reader.authorName || '?')[0].toUpperCase() }}</span>
          <span class="ds-muted">{{ authorLabel(reader) }} · {{ formatDate(reader.updatedAt || reader.createdAt) }}</span>
        </div>
        <div v-if="reader.tags?.length" class="rd-tags">
          <span v-for="t in reader.tags" :key="t" class="ds-badge ds-badge-violet">{{ t }}</span>
        </div>
        <div class="md-body" v-html="renderFull(reader.body)"></div>
      </div>
      <template #footer>
        <button class="ds-btn" @click="copyEntry(reader)">{{ copiedId === reader?.id ? 'Copied' : 'Copy content' }}</button>
        <button class="ds-btn" @click="downloadEntry(reader)">Download .md</button>
        <button v-if="reader && canEdit(reader)" class="ds-btn ds-btn-primary" @click="openEdit(reader)">Edit</button>
      </template>
    </AppModal>

    <!-- ── Editor ─────────────────────────────────────────────── -->
    <AppModal :show="editorOpen" :title="editing.id ? 'Edit entry' : 'New entry'" @close="editorOpen = false">
      <div class="ed">
        <div class="ed-row">
          <label class="ds-field ed-f-title">
            <span class="ds-label">Title</span>
            <input class="ds-input" v-model="editing.title" placeholder="e.g. Vue component from Figma" maxlength="140" />
          </label>
          <div class="ds-field ed-f-type">
            <span class="ds-label">Type</span>
            <div class="ds-segmented" role="group" aria-label="Type">
              <button
                v-for="t in TYPES" :key="t.value"
                type="button" class="ds-seg-item"
                :aria-pressed="editing.type === t.value"
                @click="editing.type = t.value"
              >{{ t.label }}</button>
            </div>
          </div>
        </div>

        <div class="ds-field">
          <span class="ds-label">Tags <span class="ds-muted">(optional)</span></span>
          <div class="ed-tags">
            <span v-for="t in editing.tags" :key="t" class="ds-badge ds-badge-violet">
              {{ t }}
              <button class="ed-tag-rm" @click="editing.tags = editing.tags.filter(x => x !== t)" aria-label="Remove tag">×</button>
            </span>
            <input class="ds-input ed-tag-input" v-model="tagInput" placeholder="Add tag + Enter" @keydown.enter.prevent="addTag" />
          </div>
        </div>

        <div class="ds-field">
          <div class="ed-body-head">
            <span class="ds-label">Content (Markdown)</span>
            <div class="ds-segmented" role="group" aria-label="Editor mode">
              <button type="button" class="ds-seg-item" :aria-pressed="!showPreview" @click="showPreview = false">Write</button>
              <button type="button" class="ds-seg-item" :aria-pressed="showPreview" @click="showPreview = true">Preview</button>
            </div>
          </div>
          <textarea
            v-if="!showPreview"
            v-model="editing.body"
            class="ds-input ds-textarea ed-textarea"
            rows="14"
            placeholder="# Heading&#10;&#10;Write your prompt, skill or doc in Markdown…"
          ></textarea>
          <div v-else class="md-body ed-preview" v-html="renderFull(editing.body || '_Nothing to preview yet._')"></div>
        </div>
      </div>
      <template #footer>
        <button class="ds-btn" @click="editorOpen = false">Cancel</button>
        <button class="ds-btn ds-btn-primary" @click="saveEntry" :disabled="!editing.title.trim() || !editing.body.trim() || saving">
          {{ editing.id ? 'Save changes' : 'Add to library' }}
        </button>
      </template>
    </AppModal>

    <!-- ── Delete confirm ─────────────────────────────────────── -->
    <AppModal :show="!!deleteTarget" title="Delete entry?" @close="deleteTarget = null">
      <p class="ds-modal-body">Delete <strong>{{ deleteTarget?.title }}</strong> from the shared library? This can't be undone.</p>
      <template #footer>
        <button class="ds-btn" @click="deleteTarget = null">Cancel</button>
        <button class="ds-btn ds-btn-danger" @click="doDelete" :disabled="deleting">Delete</button>
      </template>
    </AppModal>

    <!-- ── Drop overlay ───────────────────────────────────────── -->
    <transition name="fade">
      <div v-if="dragging" class="drop-overlay">
        <div class="drop-zone">
          <svg class="ds-icon drop-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
          <div class="drop-text">Drop .md files here</div>
          <div class="ds-muted">Supports .md, .markdown, .txt</div>
        </div>
      </div>
    </transition>
  </AppShell>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { dbService } from '@/services/db'
import AppShell from '@/components/layout/AppShell.vue'
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
// ── Page header ─────────────────────────────────────────────────────
.pg-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.pg-title { margin: 0; font-size: 28px; line-height: 34px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
.pg-sub { margin: var(--space-1) 0 0; font-size: 14px; color: var(--ink-muted); }
.pg-actions { display: flex; gap: var(--space-2); flex: none; }

// ── Filter tabs ─────────────────────────────────────────────────────
.lib-tabs { margin-bottom: var(--space-5); }
.lib-tabs .ds-badge { margin-left: var(--space-1); height: 18px; padding: 0 6px; font-size: 11px; }

.lib-loading { padding: var(--space-8) 0; text-align: center; }

// ── Grid / cards ────────────────────────────────────────────────────
.lib-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
.lib-card { display: flex; flex-direction: column; gap: var(--space-3); }
.lc-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.lc-acts { display: flex; gap: 2px; opacity: 0; transition: opacity 120ms; }
.lib-card:hover .lc-acts, .lib-card:focus-within .lc-acts { opacity: 1; }
.lc-del:hover { color: var(--danger-text); }
.lc-title { margin: 0; font-size: 15px; line-height: 22px; font-weight: 700; letter-spacing: -0.005em; color: var(--ink); }
.lc-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--line-soft);
}

// ── Reader modal ────────────────────────────────────────────────────
.rd-meta { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-3); }
.rd-tags { display: flex; flex-wrap: wrap; gap: var(--space-1); margin-bottom: var(--space-4); }
.rd .md-body { padding-top: var(--space-4); border-top: 1px solid var(--line); }

// ── Editor form ─────────────────────────────────────────────────────
.ed { display: flex; flex-direction: column; gap: var(--space-4); }
.ed-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.ed-f-title { flex: 1 1 220px; }
.ed-f-type { flex: 1 1 260px; min-width: 0; }
.ed-tags { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
.ed-tags .ds-badge { gap: 4px; }
.ed-tag-rm { background: none; border: 0; color: inherit; cursor: pointer; font-size: 14px; line-height: 1; padding: 0; opacity: .7; &:hover { opacity: 1; } }
.ed-tag-input { width: 160px; height: 28px; }
.ed-body-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-1); }
.ed-textarea { min-height: 240px; font-family: var(--font-mono); font-size: 13px; line-height: 20px; }
.ed-preview { min-height: 240px; background: var(--bg-200); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); }

// ── Drop overlay ────────────────────────────────────────────────────
.drop-overlay {
  position: fixed; inset: 0; z-index: var(--z-overlay);
  background: var(--overlay);
  display: grid; place-items: center;
  pointer-events: none;
}
.drop-zone {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-12) var(--space-16);
  border: 2px dashed var(--peach);
  border-radius: var(--radius-xl);
  background: var(--peach-soft);
}
.drop-icon { width: 40px; height: 40px; color: var(--peach-text); }
.drop-text { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }

.fade-enter-active, .fade-leave-active { transition: opacity 120ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<!-- Rendered-markdown styling — not scoped so v-html content is styled -->
<style lang="scss">
.md-body {
  color: var(--ink-muted);
  font-size: 14px;
  line-height: 22px;
  word-break: break-word;

  h1, h2, h3, h4 { color: var(--ink); font-weight: 700; line-height: 1.35; margin: 1.6em 0 0.6em; letter-spacing: -0.01em; }
  h1 { font-size: 20px; }
  h2 { font-size: 17px; }
  h3 { font-size: 15px; }
  h4 { font-size: 14px; }
  p { margin: 0 0 1em; }
  a { color: var(--peach-text); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--peach-text) 40%, transparent); }
  a:hover { border-bottom-color: var(--peach-text); }
  strong { color: var(--ink); font-weight: 600; }
  em { font-style: italic; }

  ul, ol { margin: 0 0 1em; padding-left: 1.5em; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  li { margin-bottom: 0.5em; }
  li:last-child { margin-bottom: 0; }
  li::marker { color: var(--peach); }
  ul ul, ol ol, ul ol, ol ul { margin: 0.5em 0; }

  code {
    font-family: var(--font-mono);
    font-size: 0.86em;
    background: var(--bg-200);
    color: var(--peach-text);
    padding: 2px 6px;
    border-radius: var(--radius-xs);
  }
  pre {
    background: var(--bg-000);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    overflow-x: auto;
    margin: 1.2em 0;
    line-height: 20px;
    code { background: none; color: var(--ink); padding: 0; font-size: 0.9em; }
  }

  blockquote {
    border-left: 3px solid var(--peach);
    margin: 1.2em 0;
    padding: 2px 0 2px var(--space-4);
    color: var(--ink-muted);
  }

  hr { border: none; border-top: 1px solid var(--line); margin: 1.6em 0; }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1.2em 0;
    font-size: 13px;
  }
  th, td { border: 1px solid var(--line); padding: 8px 12px; text-align: left; }
  th { background: var(--bg-200); color: var(--ink); font-weight: 600; }

  img { max-width: 100%; border-radius: var(--radius-sm); }

  > :first-child { margin-top: 0; }
  > :last-child { margin-bottom: 0; }
}
</style>
