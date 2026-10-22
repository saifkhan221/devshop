/**
 * useAllTasks - one view over every project's Task List tool data.
 *
 * Each project's tasks live where the Task List tool keeps them
 * (useToolStorage(projectId, 'task-list')), so a task added here shows up in
 * that project's tool and vice versa. GENERAL_ID holds tasks that belong to
 * no project.
 */
import { shallowReactive, computed, watch } from 'vue'
import { useToolStorage } from './useToolStorage'

export const GENERAL_ID = 'general'
const TOOL_ID = 'task-list'

export function useAllTasks(projects) {
  // shallowReactive so each entry keeps its own { data: Ref, save } untouched
  const stores = shallowReactive({})

  function ensure(pid) {
    if (!stores[pid]) stores[pid] = useToolStorage(pid, TOOL_ID, [])
    return stores[pid]
  }

  ensure(GENERAL_ID)
  watch(() => projects.value.map(p => p.id), ids => ids.forEach(ensure), { immediate: true })

  const all = computed(() =>
    Object.entries(stores).flatMap(([projectId, s]) =>
      (s.data.value || []).map(t => ({ ...t, projectId }))
    )
  )

  function write(pid, next) {
    const s = ensure(pid)
    s.data.value = next
    s.save(next)
  }

  function add(pid, task) { write(pid, [...ensure(pid).data.value, task]) }
  function toggle(pid, id) { write(pid, ensure(pid).data.value.map(t => t.id === id ? { ...t, done: !t.done } : t)) }
  function remove(pid, id) { write(pid, ensure(pid).data.value.filter(t => t.id !== id)) }

  return { all, add, toggle, remove }
}
