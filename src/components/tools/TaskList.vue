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
      <AppDatePicker v-model="newDue" />

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
      <VueDraggable
        v-model="tasks"
        :animation="200"
        handle=".drag-handle"
        class="drag-list"
        @update="save(tasks)"
      >
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="task-item"
        :class="{ 'is-editing': editingId === task.id }"
      >
        <!-- 9-dot drag handle -->
        <div class="drag-handle" title="Drag to reorder">
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2" cy="2"  r="1.1"/>
            <circle cx="8" cy="2"  r="1.1"/>
            <circle cx="2" cy="7"  r="1.1"/>
            <circle cx="8" cy="7"  r="1.1"/>
            <circle cx="2" cy="12" r="1.1"/>
            <circle cx="8" cy="12" r="1.1"/>
          </svg>
        </div>

        <input type="checkbox" :checked="task.done" @change="toggleTask(task.id)" class="task-check" />
        <span
          v-if="editingId !== task.id"
          class="task-label"
          :class="{ done: task.done }"
          @dblclick="startEdit(task)"
          title="Double-click to edit"
        >{{ task.text }}</span>
        <input
          v-else
          :ref="el => { if (el) editInputs[task.id] = el }"
          v-model="editText"
          class="task-edit-input"
          @keydown.enter="commitEdit(task.id)"
          @keydown.esc="cancelEdit"
          @blur="commitEdit(task.id)"
        />
        <span v-if="task.priority" class="priority-badge" :class="task.priority">{{ task.priority }}</span>
        <span v-if="task.due" class="due-date">📅 {{ formatDate(task.due) }}</span>
        <button class="task-delete" @click="deleteTask(task.id)">✕</button>
      </div>
      </VueDraggable>
    </div>

    <div class="list-footer">
      <button v-if="tasks.some(t => t.done)" class="clear-btn" @click="clearCompleted">Clear completed</button>
      <span class="enter-hint">↵ Enter to add</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useToolStorage } from '@/composables/useToolStorage'
import AppDatePicker from '@/components/ui/AppDatePicker.vue'

const props = defineProps({ projectId: String })

const { data: tasks, save } = useToolStorage(props.projectId, 'task-list', [])

const newTask      = ref('')
const newPriority  = ref('')
const newDue       = ref(todayISO())   // default to today
const filter       = ref('All')
const filters      = ['All', 'Active', 'Completed']
const priorities   = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Priority dropdown
const priorityOpen   = ref(false)
const priorityDropRef = ref(null)

function pickPriority(val) { newPriority.value = val; priorityOpen.value = false }
function onPriorityOutside(e) {
  if (priorityDropRef.value && !priorityDropRef.value.contains(e.target)) priorityOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', onPriorityOutside))
onUnmounted(() => document.removeEventListener('mousedown', onPriorityOutside))

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
  newDue.value      = todayISO()  // reset to today after adding
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

// ── Inline editing ───────────────────────────────────────────────────────────
const editingId  = ref(null)
const editText   = ref('')
const editInputs = {}

function startEdit(task) {
  editingId.value = task.id
  editText.value  = task.text
  nextTick(() => {
    const el = editInputs[task.id]
    if (el) { el.focus(); el.select() }
  })
}

function commitEdit(id) {
  if (editingId.value !== id) return
  const task = tasks.value.find(t => t.id === id)
  if (task && editText.value.trim()) task.text = editText.value.trim()
  editingId.value = null
  editText.value  = ''
}

function cancelEdit() {
  editingId.value = null
  editText.value  = ''
}

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
.drag-list { display: flex; flex-direction: column; gap: 0; }

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 12px 10px;
  background: $bg-elevated;
  border-radius: $radius-md;
  margin-bottom: 8px;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s;
  border: 1px solid transparent;
  cursor: default;

  &:hover .task-delete { opacity: 1; }
}

// ── Drag handle ─────────────────────────────────────────────────────────
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  flex-shrink: 0;
  color: $brand-400;
  opacity: 0.45;
  cursor: grab;
  transition: opacity 0.15s, color 0.15s;
  padding: 2px 0;

  &:hover { color: $brand-300; }
  &:active { cursor: grabbing; }
}

.task-check { width: 16px; height: 16px; accent-color: $brand-500; cursor: pointer; flex-shrink: 0; }

.task-label {
  flex: 1;
  font-size: 13px;
  color: #fff;
  cursor: text;
  &.done { text-decoration: line-through; color: $brand-400; }
}

.task-edit-input {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--accent);
  border-radius: 0;
  padding: 0 2px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #fff;
  outline: none;
  min-width: 0;
}

.task-item.is-editing {
  border-color: var(--border-subtle);
}

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
