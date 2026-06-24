<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-label">Tools</div>
    </div>

    <div class="sidebar-list">
      <VueDraggable v-model="toolList" item-key="id" handle=".drag-handle" @end="onDragEnd">
        <div
          v-for="tool in toolList"
          :key="tool.id"
          class="tool-item"
          :class="{ active: activeTool === tool.id, hidden: isHidden(tool.id) }"
          @click="selectTool(tool.id)"
        >
          <span class="drag-handle">⠿</span>
          <span class="tool-item-icon">{{ tool.icon }}</span>
          <span class="tool-item-name">{{ tool.name }}</span>

          <!-- Hover actions -->
          <div class="tool-actions">
            <button
              class="tool-action-btn"
              :title="isHidden(tool.id) ? 'Show tool' : 'Hide tool'"
              @click.stop="toggleHide(tool.id)"
            >
              <svg v-if="isHidden(tool.id)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="tool-action-btn tool-action-btn--del" title="Remove tool" @click.stop="askRemove(tool)">✕</button>
          </div>
        </div>
      </VueDraggable>
    </div>

    <div class="sidebar-footer">
      <router-link :to="`/project/${projectId}/setup`" class="btn-add-sidebar">+ Add Tool</router-link>
    </div>

    <!-- Delete confirmation modal -->
    <transition name="modal-fade">
      <div v-if="deleteModal.open" class="del-backdrop" @click.self="deleteModal.open = false">
        <div class="del-modal">
          <div class="del-icon">🗑️</div>
          <div class="del-title">Remove "{{ deleteModal.tool?.name }}"?</div>
          <div class="del-sub">Choose what happens to this tool's saved data.</div>

          <div class="del-options">
            <button class="del-opt" @click="confirmRemove(false)">
              <span class="del-opt-icon">📦</span>
              <div>
                <div class="del-opt-label">Remove from project</div>
                <div class="del-opt-desc">Keeps the data — you can re-add later</div>
              </div>
            </button>
            <button class="del-opt del-opt--danger" @click="confirmRemove(true)">
              <span class="del-opt-icon">🔥</span>
              <div>
                <div class="del-opt-label">Remove &amp; delete data</div>
                <div class="del-opt-desc">Permanently erases all saved data for this tool</div>
              </div>
            </button>
          </div>

          <button class="del-cancel" @click="deleteModal.open = false">Cancel</button>
        </div>
      </div>
    </transition>
  </aside>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'
import { VueDraggable } from 'vue-draggable-plus'
import { TOOLS } from '@/config/tools'

const props = defineProps({
  projectId: String,
  activeTool: String,
})
const emit = defineEmits(['tool-select'])
const store = useStore()

const project = computed(() => store.getters['projects/projectById'](props.projectId))
const toolList = ref([])

watch(project, (p) => {
  if (p) {
    const order = p.toolOrder || p.tools || []
    toolList.value = order.map(id => TOOLS.find(t => t.id === id)).filter(Boolean)
  }
}, { immediate: true })

// ─── Hidden tools ──────────────────────────────────────────────────────────
const hiddenTools = computed(() => project.value?.hiddenTools || [])

function isHidden(id) { return hiddenTools.value.includes(id) }

async function toggleHide(id) {
  const current = [...hiddenTools.value]
  const next = current.includes(id) ? current.filter(t => t !== id) : [...current, id]
  await store.dispatch('projects/updateProject', {
    id: props.projectId,
    data: { hiddenTools: next },
  })
}

// ─── Select ────────────────────────────────────────────────────────────────
function selectTool(id) { emit('tool-select', id) }

// ─── Drag reorder ──────────────────────────────────────────────────────────
async function onDragEnd() {
  const newOrder = toolList.value.map(t => t.id)
  await store.dispatch('projects/updateProject', {
    id: props.projectId,
    data: { toolOrder: newOrder },
  })
}

// ─── Delete modal ──────────────────────────────────────────────────────────
const deleteModal = ref({ open: false, tool: null })

function askRemove(tool) {
  deleteModal.value = { open: true, tool }
}

async function confirmRemove(deleteData) {
  const id = deleteModal.value.tool?.id
  if (!id) return

  // Remove from project
  const p = store.getters['projects/projectById'](props.projectId)
  const newTools = (p.tools || []).filter(t => t !== id)
  const newOrder = (p.toolOrder || []).filter(t => t !== id)
  const newHidden = (p.hiddenTools || []).filter(t => t !== id)

  await store.dispatch('projects/updateProject', {
    id: props.projectId,
    data: { tools: newTools, toolOrder: newOrder, hiddenTools: newHidden },
  })

  toolList.value = toolList.value.filter(t => t.id !== id)

  // Optionally wipe tool data from localStorage
  if (deleteData) {
    const lsKey = `devshop_tool_${props.projectId}_${id}`
    localStorage.removeItem(lsKey)
  }

  deleteModal.value.open = false
  store.dispatch('ui/toast', { message: deleteData ? 'Tool and data removed' : 'Tool removed', type: 'info' })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: $bg-surface;
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 14px 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-label {
  font-size: 10px; font-weight: 600;
  color: rgba(167,139,250,0.5);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 2px; }
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 10px;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  margin-bottom: 2px;
  user-select: none;

  &:hover { background: $bg-elevated; }
  &.active { background: $brand-700; }
  &:hover .tool-actions { opacity: 1; }

  &.hidden {
    opacity: 0.45;
    .tool-item-name { text-decoration: line-through; }
  }
}

.drag-handle {
  color: rgba(167,139,250,0.3);
  font-size: 12px;
  cursor: grab;
  flex-shrink: 0;
  padding: 2px;
  transition: color 0.2s;
  .tool-item:hover & { color: rgba(167,139,250,0.6); }
}

.tool-item-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

.tool-item-name {
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  .active & { color: #fff; }
}

// ── Hover action buttons ────────────────────────────────────────────────────
.tool-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.tool-action-btn {
  width: 18px; height: 18px;
  background: transparent;
  border: none;
  color: rgba(167,139,250,0.4);
  cursor: pointer;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  transition: all 0.15s;
  padding: 0;
  &:hover { color: $brand-200; background: $bg-surface; }
  &--del:hover { color: #f87171; background: rgba(239,68,68,0.12); }
}

// ── Footer ──────────────────────────────────────────────────────────────────
.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid var(--border-subtle);
}

.btn-add-sidebar {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px;
  background: transparent;
  border: 1px dashed var(--accent-glow);
  border-radius: 9px;
  color: $brand-400;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  text-decoration: none;
  &:hover { background: var(--accent-subtle); border-color: var(--accent-glow); color: $brand-300; }
}

// ── Delete modal ─────────────────────────────────────────────────────────────
.del-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 400;
  padding: 16px;
}

.del-modal {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 28px 24px 20px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.del-icon { font-size: 36px; margin-bottom: 12px; }
.del-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
.del-sub { font-size: 12px; color: $brand-400; margin-bottom: 20px; }

.del-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 14px;
}

.del-opt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  width: 100%;
  &:hover { border-color: $brand-500; background: $bg-elevated; }

  &--danger {
    border-color: rgba(239,68,68,0.2);
    &:hover { border-color: #f87171; background: rgba(239,68,68,0.06); }
    .del-opt-label { color: #f87171; }
  }
}

.del-opt-icon { font-size: 20px; flex-shrink: 0; }
.del-opt-label { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px; }
.del-opt-desc { font-size: 11px; color: $brand-400; }

.del-cancel {
  background: transparent;
  border: none;
  color: $brand-500;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  cursor: pointer;
  padding: 6px;
  &:hover { color: $brand-300; }
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
