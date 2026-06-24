<template>
  <div class="task-list">
    <div class="add-row">
      <input
        v-model="newTask"
        class="task-input"
        placeholder="Add a new task..."
        @keydown.enter="addTask"
      />

      <!-- Custom Priority Dropdown -->
      <div class="custom-drop" ref="priorityDropRef">
        <button class="drop-trigger" @click="priorityOpen = !priorityOpen">
          <span v-if="newPriority" class="dot" :class="newPriority"></span>
          <span>{{ newPriority ? capitalize(newPriority) : 'Priority' }}</span>
          <svg class="drop-caret" :class="{ open: priorityOpen }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <transition name="drop">
          <div v-if="priorityOpen" class="drop-panel">
            <button class="drop-opt" :class="{ active: newPriority === '' }" @click="pickPriority('')">
              <span class="drop-opt-spacer"></span>
              None
            </button>
            <button v-for="p in priorities" :key="p.value" class="drop-opt" :class="{ active: newPriority === p.value }" @click="pickPriority(p.value)">
              <span class="dot" :class="p.value"></span>
              {{ p.label }}
            </button>
          </div>
        </transition>
      </div>

      <!-- Custom Date Picker -->
      <div class="date-wrap">
        <button class="drop-trigger date-trigger" @click="openDatePicker">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{{ newDue ? formatDate(newDue) : todayLabel }}</span>
        </button>
        <input ref="dateInputRef" type="date" class="hidden-date" v-model="newDue" />
      </div>

      <button class="add-btn" @click="addTask">Add</button>
    </div>

    <div class="filter-tabs">
      <button v-for="f in filters" :key="f" class="filter-tab" :class="{ active: filter === f }" @click="filter = f">
        {{ f }} <span class="tab-count">{{ countFor(f) }}</span>
      </button>
      <span class="remaining">{{ remaining }} remaining</span>
    </div>

    <div class="tasks">
      <div v-if="filteredTasks.length === 0" class="empty">No tasks here yet</div>
      <div v-for="task in filteredTasks" :key="task.id" class="task-item">
        <input type="checkbox" :checked="task.done" @change="toggleTask(task.id)" class="task-check" />
        <span class="task-label" :class="{ done: task.done }">{{ task.text }}</span>
        <span v-if="task.priority" class="priority-badge" :class="task.priority">{{ task.priority }}</span>
        <span v-if="task.due" class="due-date">📅 {{ formatDate(task.due) }}</span>
        <button class="task-delete" @click="deleteTask(task.id)">✕</button>
      </div>
    </div>

    <div class="list-footer">
      <button v-if="tasks.some(t => t.done)" class="clear-btn" @click="clearCompleted">Clear completed</button>
      <span class="enter-hint">↵ Enter to add</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const { data: tasks, save } = useToolStorage(props.projectId, 'task-list', [])

const newTask      = ref('')
const newPriority  = ref('')
const newDue       = ref('')
const filter       = ref('All')
const filters      = ['All', 'Active', 'Completed']
const priorities   = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

// Priority dropdown
const priorityOpen   = ref(false)
const priorityDropRef = ref(null)

function pickPriority(val) { newPriority.value = val; priorityOpen.value = false }
function onPriorityOutside(e) {
  if (priorityDropRef.value && !priorityDropRef.value.contains(e.target)) priorityOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', onPriorityOutside))
onUnmounted(() => document.removeEventListener('mousedown', onPriorityOutside))

// Date picker — proxy click onto hidden native input
const dateInputRef = ref(null)
function openDatePicker() { dateInputRef.value?.showPicker?.() }

// Today's label shown when no date selected
const todayLabel = computed(() => formatDate(new Date().toISOString().split('T')[0]))

// Stats
const remaining = computed(() => tasks.value.filter(t => !t.done).length)
const countFor = (f) => {
  if (f === 'Active')    return tasks.value.filter(t => !t.done).length
  if (f === 'Completed') return tasks.value.filter(t => t.done).length
  return tasks.value.length
}

const filteredTasks = computed(() => {
  if (filter.value === 'Active')    return tasks.value.filter(t => !t.done)
  if (filter.value === 'Completed') return tasks.value.filter(t => t.done)
  return tasks.value
})

watch(tasks, (val) => save(val), { deep: true })

function addTask() {
  if (!newTask.value.trim()) return
  tasks.value.push({
    id:       Date.now(),
    text:     newTask.value.trim(),
    done:     false,
    priority: newPriority.value || null,
    due:      newDue.value || null,
  })
  newTask.value     = ''
  newPriority.value = ''
  newDue.value      = ''
}

function toggleTask(id) {
  const task = tasks.value.find(t => t.id === id)
  if (task) task.done = !task.done
}

function deleteTask(id) {
  tasks.value = tasks.value.filter(t => t.id !== id)
}

function clearCompleted() {
  tasks.value = tasks.value.filter(t => !t.done)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.add-row { display: flex; gap: 8px; margin-bottom: 16px; align-items: center; }

.task-input {
  flex: 1;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: 10px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #fff;
  outline: none;
  min-width: 0;
  &:focus { border-color: $brand-500; }
  &::placeholder { color: rgba(167,139,250,0.4); }
}

// ── Shared trigger style (matches dashboard sort dropdown) ──────────────
.drop-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
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
  &:hover { border-color: var(--accent); color: $text-heading; }
}

.drop-caret {
  color: $brand-400;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  &.open { transform: rotate(180deg); }
}

// ── Priority dropdown ───────────────────────────────────────────────────
.custom-drop { position: relative; }

.drop-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 140px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 12px 36px rgba(0,0,0,0.35);
  z-index: 100;
}

.drop-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
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
  &:hover { background: $bg-elevated; color: $text-heading; }
  &.active { color: var(--accent); }
}

.drop-opt-spacer { width: 8px; flex-shrink: 0; }

.dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  &.high   { background: #f87171; }
  &.medium { background: #fbbf24; }
  &.low    { background: #34d399; }
}

// Dropdown animation
.drop-enter-active, .drop-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.97); }

// ── Date picker ─────────────────────────────────────────────────────────
.date-wrap { position: relative; }

.date-trigger { gap: 7px; }

.hidden-date {
  position: absolute;
  top: 0; left: 0;
  width: 0; height: 0;
  opacity: 0;
  pointer-events: none;
}

// ── Add button ──────────────────────────────────────────────────────────
.add-btn {
  padding: 10px 18px;
  background: $brand-600;
  border: none; border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  white-space: nowrap;
  &:hover { background: $brand-500; }
}

// ── Filter tabs ─────────────────────────────────────────────────────────
.filter-tabs { display: flex; gap: 6px; margin-bottom: 16px; align-items: center; }

.filter-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  color: $brand-400;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &.active { background: $brand-700; color: #fff; border-color: $brand-600; }
  &:hover:not(.active) { border-color: $brand-500; color: $brand-300; }
}

.tab-count {
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
}

.remaining { margin-left: auto; font-size: 12px; color: $brand-400; }

// ── Task items ──────────────────────────────────────────────────────────
.empty { text-align: center; padding: 24px; color: $brand-400; font-size: 13px; }

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: $bg-elevated;
  border-radius: $radius-md;
  margin-bottom: 8px;
  transition: all 0.2s;
  &:hover .task-delete { opacity: 1; }
}

.task-check { width: 16px; height: 16px; accent-color: $brand-500; cursor: pointer; flex-shrink: 0; }
.task-label { flex: 1; font-size: 13px; color: #fff; &.done { text-decoration: line-through; color: $brand-400; } }

.priority-badge {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 20px;
  white-space: nowrap; flex-shrink: 0;
  &.high   { background: rgba(239,68,68,0.15);  color: #f87171; }
  &.medium { background: rgba(245,158,11,0.15); color: #fbbf24; }
  &.low    { background: rgba(16,185,129,0.15); color: #34d399; }
}

.due-date { font-size: 11px; color: $brand-400; white-space: nowrap; flex-shrink: 0; }

.task-delete {
  width: 20px; height: 20px;
  background: transparent; border: none;
  color: $brand-400; cursor: pointer; font-size: 10px;
  opacity: 0; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px; flex-shrink: 0;
  &:hover { color: #f87171; background: rgba(239,68,68,0.1); }
}

// ── Footer ──────────────────────────────────────────────────────────────
.list-footer { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; }

.clear-btn {
  background: transparent; border: none;
  color: $brand-400; font-size: 12px; cursor: pointer;
  &:hover { color: #f87171; }
}

.enter-hint { font-size: 11px; color: $brand-400; opacity: 0.6; margin-left: auto; }
</style>
