<template>
  <div class="kanban-board">
    <VueDraggable
      v-model="columns"
      :animation="180"
      handle=".col-drag"
      ghost-class="col-ghost"
      class="board-columns"
      @end="save"
    >
      <div v-for="(col, colIdx) in columns" :key="col.id" class="kanban-col">
        <div class="col-header">
          <div class="col-title-row">
            <span class="col-drag" title="Drag to reorder column">⠿</span>
            <span v-if="!col.editing" class="col-title" @dblclick="startEdit(col)">{{ col.name }}</span>
            <input v-else v-focus class="col-title-input" v-model="col.name" @blur="col.editing = false" @keydown.enter="col.editing = false" />
            <span class="col-count">{{ col.cards.length }}</span>
          </div>
          <button class="col-del" @click="deleteColumn(colIdx)" title="Delete column">✕</button>
        </div>

        <VueDraggable
          v-model="col.cards"
          :group="'kanban'"
          :animation="180"
          handle=".card-drag"
          ghost-class="card-ghost"
          drag-class="card-dragging"
          class="card-list"
          @end="save"
        >
          <div v-for="card in col.cards" :key="card.id" class="kanban-card">
            <span class="card-drag" title="Drag to move">⠿</span>
            <div class="card-content">
              <div class="card-title">{{ card.title }}</div>
              <div v-if="card.desc" class="card-desc">{{ card.desc }}</div>
            </div>
            <button class="card-del" @click="deleteCard(col, card.id)">✕</button>
          </div>
        </VueDraggable>

        <div class="add-card-form">
          <input
            class="add-card-input"
            :placeholder="'+ Add a card'"
            v-model="col.newCardTitle"
            @keydown.enter="addCard(col)"
          />
        </div>
      </div>
    </VueDraggable>

    <div class="add-col">
      <button class="add-col-btn" @click="addColumn">+ Add Column</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const vFocus = { mounted: (el) => el.focus() }

const defaultColumns = [
  { id: 1, name: 'To Do', cards: [{ id: 1, title: 'Set up project structure', desc: '' }] },
  { id: 2, name: 'In Progress', cards: [] },
  { id: 3, name: 'Review', cards: [] },
  { id: 4, name: 'Done', cards: [] },
]

const { data: storedColumns, save: persist } = useToolStorage(props.projectId, 'kanban', defaultColumns)

// Add reactive UI fields (not persisted) on top of stored data
const columns = ref([])
watch(storedColumns, (val) => {
  columns.value = val.map(c => ({ ...c, newCardTitle: '', editing: false }))
}, { immediate: true })

function save() {
  const clean = columns.value.map(c => ({ id: c.id, name: c.name, cards: c.cards }))
  persist(clean)
}

watch(columns, save, { deep: true })

function addCard(col) {
  if (!col.newCardTitle.trim()) return
  col.cards.push({ id: Date.now(), title: col.newCardTitle.trim(), desc: '' })
  col.newCardTitle = ''
}

function deleteCard(col, id) {
  col.cards = col.cards.filter(c => c.id !== id)
}

function addColumn() {
  columns.value.push({ id: Date.now(), name: 'New Column', cards: [], newCardTitle: '', editing: false })
}

function deleteColumn(i) {
  columns.value.splice(i, 1)
}

function startEdit(col) {
  col.editing = true
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.kanban-board { overflow-x: auto; }

.board-columns {
  display: flex;
  gap: 16px;
  min-height: 400px;
  align-items: flex-start;
}

// ── Column ghost when dragging a column ─────────────────────────────
:deep(.col-ghost) {
  opacity: 0.4;
  border: 2px dashed var(--accent) !important;
  background: var(--accent-subtle) !important;
}

.kanban-col {
  width: 240px;
  flex-shrink: 0;
  background: $bg-elevated;
  border-radius: $radius-lg;
  padding: 12px;
}

.col-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.col-title-row { display: flex; align-items: center; gap: 8px; flex: 1; }

.col-drag {
  color: rgba(167,139,250,0.3);
  cursor: grab;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: $brand-400; }
  &:active { cursor: grabbing; }
}

.col-title { font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; }
.col-title-input { background: $bg-surface; border: 1px solid $brand-500; border-radius: 4px; padding: 3px 6px; font-size: 13px; font-weight: 600; color: #fff; outline: none; width: 120px; }
.col-count { font-size: 11px; font-weight: 600; color: $brand-400; background: $bg-surface; padding: 2px 7px; border-radius: 20px; }
.col-del { background: transparent; border: none; color: rgba(167,139,250,0.3); cursor: pointer; font-size: 10px; &:hover { color: #f87171; } }

// ── Card list drop zone ──────────────────────────────────────────────
.card-list { min-height: 50px; }

// Ghost: the placeholder left in the origin column while dragging
:deep(.card-ghost) {
  opacity: 0;
  border: 2px dashed var(--accent) !important;
  background: var(--accent-subtle) !important;
  border-radius: $radius-sm;
  height: 52px;
}

// The card being actively dragged (follows the cursor)
:deep(.card-dragging) {
  opacity: 0.95;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--accent) !important;
  transform: rotate(1.5deg) scale(1.02);
  cursor: grabbing !important;
}

.kanban-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-sm;
  padding: 10px 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:hover {
    border-color: var(--accent-glow);
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    .card-drag { color: $brand-400; }
    .card-del { opacity: 1; }
  }
}

.card-drag {
  color: rgba(167,139,250,0.2);
  cursor: grab;
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
  padding-top: 2px;
  transition: color 0.15s;
  &:active { cursor: grabbing; }
}

.card-content { flex: 1; }
.card-title { font-size: 12px; font-weight: 500; color: #fff; margin-bottom: 4px; }
.card-desc { font-size: 11px; color: $brand-400; }
.card-del {
  background: transparent; border: none; color: rgba(167,139,250,0.2);
  cursor: pointer; font-size: 9px; flex-shrink: 0;
  opacity: 0; transition: all 0.2s;
  &:hover { color: #f87171; }
}

.add-card-form { margin-top: 8px; }
.add-card-input { width: 100%; background: transparent; border: 1px dashed var(--accent-subtle); border-radius: $radius-sm; padding: 7px 10px; font-family: 'Inter', sans-serif; font-size: 12px; color: $brand-400; outline: none; transition: all 0.2s; &:focus { border-color: $brand-500; color: #fff; background: $bg-surface; } &::placeholder { color: var(--accent-glow); } }

.add-col { display: flex; align-items: flex-start; padding-top: 4px; }
.add-col-btn { padding: 10px 16px; background: transparent; border: 2px dashed var(--accent-subtle); border-radius: $radius-lg; color: $brand-400; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; width: 180px; &:hover { border-color: $brand-500; color: $brand-300; background: var(--accent-subtle); } }
</style>
