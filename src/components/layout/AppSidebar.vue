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
          :class="{ active: activeTool === tool.id }"
          @click="selectTool(tool.id)"
        >
          <span class="drag-handle">⠿</span>
          <span class="tool-item-icon">{{ tool.icon }}</span>
          <span class="tool-item-name">{{ tool.name }}</span>
          <button class="tool-remove" @click.stop="removeTool(tool.id)">✕</button>
        </div>
      </VueDraggable>
    </div>
    <div class="sidebar-footer">
      <router-link :to="`/project/${projectId}/setup`" class="btn-add-sidebar">+ Add Tool</router-link>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useStore } from 'vuex'
import { VueDraggable } from 'vue-draggable-plus'
import { TOOLS } from '@/config/tools'

const props = defineProps({
  projectId: String,
  activeTool: String
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

function selectTool(id) {
  emit('tool-select', id)
}

async function removeTool(id) {
  const project = store.getters['projects/projectById'](props.projectId)
  const newTools = (project.tools || []).filter(t => t !== id)
  const newOrder = (project.toolOrder || []).filter(t => t !== id)
  await store.dispatch('projects/updateProject', {
    id: props.projectId,
    data: { tools: newTools, toolOrder: newOrder }
  })
  toolList.value = toolList.value.filter(t => t.id !== id)
  store.dispatch('ui/toast', { message: 'Tool removed', type: 'info' })
}

async function onDragEnd() {
  const newOrder = toolList.value.map(t => t.id)
  await store.dispatch('projects/updateProject', {
    id: props.projectId,
    data: { toolOrder: newOrder }
  })
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
  &:hover .tool-remove { opacity: 1; }
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

.tool-remove {
  width: 18px; height: 18px;
  background: transparent;
  border: none;
  color: rgba(167,139,250,0.3);
  cursor: pointer;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover { color: #f87171; background: rgba(239,68,68,0.12); }
}

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
  &:hover {
    background: var(--accent-subtle);
    border-color: var(--accent-glow);
    color: $brand-300;
  }
}
</style>
