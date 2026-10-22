<template>
  <div
    class="ds-card ds-card-link tasks-card"
    role="button" tabindex="0" aria-label="Open tasks"
    @click="openModal" @keydown.enter.self="openModal"
  >
    <div class="tw-head">
      <span class="ds-stat-label">Tasks</span>
      <span class="ds-badge" :class="{ 'ds-badge-peach': openCount }">{{ openCount ? `${openCount} open` : 'All clear' }}</span>
    </div>

    <ul v-if="preview.length" class="tw-list">
      <li v-for="t in preview" :key="t.projectId + '-' + t.id" class="tw-item">
        <label class="ds-check" @click.stop>
          <input type="checkbox" :checked="t.done" @change="toggle(t.projectId, t.id)" :aria-label="`Mark ${t.text} done`" />
          <span class="ds-check-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>
        </label>
        <span class="tw-text">{{ t.text }}</span>
        <span v-if="t.due" class="tw-due" :class="{ late: isLate(t) }">{{ fmtDue(t.due) }}</span>
      </li>
    </ul>
    <p v-else class="tw-empty">Nothing on your plate. Click to add a task.</p>
  </div>

  <AppModal :show="modalOpen" title="Tasks" @close="modalOpen = false">
    <form class="tm-add" @submit.prevent="addTask">
      <input
        ref="textInput" v-model="draft.text"
        class="ds-input" placeholder="What needs doing?" aria-label="Task" maxlength="200"
      />
      <div class="tm-add-row">
        <select v-model="draft.projectId" class="ds-select" aria-label="Project">
          <option :value="GENERAL_ID">No project</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <select v-model="draft.priority" class="ds-select" aria-label="Priority">
          <option value="">No priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input v-model="draft.due" type="date" class="ds-input tm-date" aria-label="Due date" />
        <button type="submit" class="ds-btn ds-btn-primary" :disabled="!draft.text.trim()">Add task</button>
      </div>
    </form>

    <div class="tm-filters">
      <div class="ds-segmented" role="group" aria-label="Filter tasks">
        <button
          v-for="f in FILTERS" :key="f.key" type="button" class="ds-seg-item"
          :aria-pressed="filter === f.key" @click="filter = f.key"
        >{{ f.label }}</button>
      </div>
      <select v-if="groupOptions.length > 1" v-model="groupFilter" class="ds-select tm-proj-filter" aria-label="Filter by project">
        <option value="all">All tasks</option>
        <option v-for="g in groupOptions" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
    </div>

    <ul v-if="visible.length" class="tm-list">
      <li v-for="t in visible" :key="t.projectId + '-' + t.id" class="tm-item" :class="{ done: t.done }">
        <label class="ds-check">
          <input type="checkbox" :checked="t.done" @change="toggle(t.projectId, t.id)" :aria-label="`Mark ${t.text} ${t.done ? 'not done' : 'done'}`" />
          <span class="ds-check-box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span>
        </label>
        <div class="tm-body">
          <span class="tm-text">{{ t.text }}</span>
          <span v-if="t.projectId !== GENERAL_ID || t.priority || t.due" class="tm-meta">
            <span v-if="t.projectId !== GENERAL_ID" class="ds-badge ds-badge-violet">{{ projectName(t.projectId) }}</span>
            <span v-if="t.priority" class="ds-badge" :class="PRIORITY_CLASS[t.priority]"><i class="ds-dot"></i>{{ cap(t.priority) }}</span>
            <span v-if="t.due" class="tm-due" :class="{ late: isLate(t) }">{{ fmtDue(t.due) }}</span>
          </span>
        </div>
        <button class="ds-icon-btn ds-icon-btn-sm tm-del" @click="remove(t.projectId, t.id)" :aria-label="`Delete ${t.text}`" title="Delete">
          <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        </button>
      </li>
    </ul>
    <div v-else class="ds-empty tm-empty">
      <div class="ds-empty-title">{{ mine.length ? 'No tasks match' : 'No tasks yet' }}</div>
      <p class="ds-empty-body">{{ mine.length ? 'Try another filter.' : 'Add one above. Pick a project to also file it in that project’s task list.' }}</p>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useStore } from 'vuex'
import AppModal from '@/components/ui/AppModal.vue'
import { useAllTasks, GENERAL_ID } from '@/composables/useAllTasks'

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'done', label: 'Done' },
  { key: 'all',  label: 'All' },
]
const PRIORITY_RANK  = { high: 0, medium: 1, low: 2 }
const PRIORITY_CLASS = { high: 'ds-badge-danger', medium: 'ds-badge-warning', low: 'ds-badge-info' }

const store = useStore()
const projects = computed(() => store.getters['projects/allProjects'] || [])
const { all, add, toggle, remove } = useAllTasks(projects)

// Only tasks added from this widget: every standalone task, plus project tasks
// flagged fromDash. Tasks created inside a project's own Task List stay there.
const mine = computed(() => {
  const ids = new Set(projects.value.map(p => p.id))
  return all.value.filter(t => t.projectId === GENERAL_ID || (t.fromDash && ids.has(t.projectId)))
})

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Open first; then earliest due (undated last); then highest priority; then oldest
function byUrgency(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1
  if ((a.due || '') !== (b.due || '')) {
    if (!a.due) return 1
    if (!b.due) return -1
    return a.due < b.due ? -1 : 1
  }
  const pa = PRIORITY_RANK[a.priority] ?? 3, pb = PRIORITY_RANK[b.priority] ?? 3
  if (pa !== pb) return pa - pb
  return a.id - b.id
}

const openCount = computed(() => mine.value.filter(t => !t.done).length)
const preview = computed(() => mine.value.filter(t => !t.done).sort(byUrgency).slice(0, 3))

const projectName = (pid) => pid === GENERAL_ID ? 'No project' : (projects.value.find(p => p.id === pid)?.name || 'Project')

// Filter by project, offering only the groups that actually have tasks
const groupOptions = computed(() => {
  const present = [...new Set(mine.value.map(t => t.projectId))]
  return present
    .map(id => ({ id, name: projectName(id) }))
    .sort((a, b) => (a.id === GENERAL_ID ? -1 : b.id === GENERAL_ID ? 1 : a.name.localeCompare(b.name)))
})

const filter = ref('open')
const groupFilter = ref('all')
const visible = computed(() =>
  mine.value
    .filter(t => filter.value === 'all' || (filter.value === 'done' ? t.done : !t.done))
    .filter(t => groupFilter.value === 'all' || t.projectId === groupFilter.value)
    .sort(byUrgency)
)

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const isLate = (t) => !t.done && t.due && t.due < todayISO()
function fmtDue(iso) {
  if (iso === todayISO()) return 'Today'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Modal / add ───────────────────────────────────────────────────
const modalOpen = ref(false)
const textInput = ref(null)
const draft = reactive({ text: '', projectId: GENERAL_ID, priority: '', due: todayISO() })

function openModal() {
  modalOpen.value = true
  nextTick(() => textInput.value?.focus())
}

// A task filed under a project must be visible in that project's board, so
// switch the Task List tool on for it if it isn't already.
function ensureTaskListTool(pid) {
  const p = projects.value.find(x => x.id === pid)
  const tools = p?.tools || []
  if (!p || tools.includes('task-list')) return
  const order = p.toolOrder || tools
  store.dispatch('projects/updateProject', {
    id: pid,
    data: { tools: [...tools, 'task-list'], toolOrder: [...order, 'task-list'] },
  })
}

function addTask() {
  const text = draft.text.trim()
  if (!text) return
  add(draft.projectId, { id: Date.now(), text, done: false, priority: draft.priority || null, due: draft.due || null, fromDash: true })
  if (draft.projectId !== GENERAL_ID) ensureTaskListTool(draft.projectId)
  draft.text = ''
  draft.priority = ''
  draft.due = todayISO()
  textInput.value?.focus()
}
</script>

<style lang="scss" scoped>
// ── Compact card ────────────────────────────────────────────────────
.tasks-card { display: flex; flex-direction: column; gap: var(--space-3); min-width: 0; }
.tw-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.tw-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.tw-item { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
.tw-text { flex: 1; min-width: 0; font-size: 14px; line-height: 22px; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tw-due, .tm-due { flex: none; font-size: 13px; line-height: 20px; color: var(--ink-muted); &.late { color: var(--danger-text); } }
.tw-empty { margin: 0; font-size: 14px; line-height: 22px; color: var(--ink-muted); }

// ── Modal ───────────────────────────────────────────────────────────
.tm-add { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
.tm-add-row { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.tm-add-row .ds-select { flex: 1 1 130px; width: auto; }
.tm-date { flex: 0 0 150px; width: auto; color-scheme: dark; }
.tm-add-row .ds-btn { flex: none; }

.tm-filters { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); flex-wrap: wrap; padding-bottom: var(--space-3); border-bottom: 1px solid var(--line); }
.tm-proj-filter { width: auto; min-width: 160px; }

.tm-list { list-style: none; margin: 0; padding: 0; }
.tm-item {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--line-soft);
  &:last-child { border-bottom: 0; }
  .ds-check { margin-top: 2px; }
  &.done .tm-text { color: var(--ink-faint); text-decoration: line-through; }
}
.tm-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-1); }
.tm-text { font-size: 15px; line-height: 24px; color: var(--ink); word-break: break-word; }
.tm-meta { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); }
.tm-del { flex: none; opacity: 0; transition: opacity 120ms; &:hover { color: var(--danger-text); } }
.tm-item:hover .tm-del, .tm-del:focus-visible { opacity: 1; }
.tm-empty { padding: var(--space-8) var(--space-4); }
</style>
