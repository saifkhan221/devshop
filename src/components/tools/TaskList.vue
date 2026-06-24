<template>
  <div class="task-list">
    <div class="add-row">
      <input
        v-model="newTask"
        class="task-input"
        placeholder="Add a new task..."
        @keydown.enter="addTask"
      />
      <select v-model="newPriority" class="priority-select">
        <option value="">Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <input type="date" v-model="newDue" class="date-input" />
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
import { ref, computed, watch } from 'vue'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const { data: tasks, save } = useToolStorage(props.projectId, 'task-list', [])

const newTask     = ref('')
const newPriority = ref('')
const newDue      = ref('')
const filter      = ref('All')
const filters     = ['All', 'Active', 'Completed']

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
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.add-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; }

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
  &:focus { border-color: $brand-500; }
  &::placeholder { color: rgba(167,139,250,0.4); }
}

.priority-select {
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: 10px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: $brand-300;
  outline: none;
  cursor: pointer;
  &:focus { border-color: $brand-500; }
  option { background: $bg-elevated; }
}

.date-input {
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: 10px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: $brand-300;
  outline: none;
  color-scheme: dark;
  &:focus { border-color: $brand-500; }
}

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

.filter-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  align-items: center;
}

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

.tasks { }
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
  &.high   { background: rgba(239,68,68,0.15);   color: #f87171; }
  &.medium { background: rgba(245,158,11,0.15);  color: #fbbf24; }
  &.low    { background: rgba(16,185,129,0.15);  color: #34d399; }
}

.due-date {
  font-size: 11px; color: $brand-400;
  white-space: nowrap; flex-shrink: 0;
}

.task-delete {
  width: 20px; height: 20px;
  background: transparent; border: none;
  color: $brand-400;
  cursor: pointer;
  font-size: 10px;
  opacity: 0;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
  &:hover { color: #f87171; background: rgba(239,68,68,0.1); }
}

.list-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.clear-btn {
  background: transparent;
  border: none;
  color: $brand-400;
  font-size: 12px;
  cursor: pointer;
  &:hover { color: #f87171; }
}

.enter-hint {
  font-size: 11px;
  color: $brand-400;
  opacity: 0.6;
  margin-left: auto;
}
</style>
