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
      <div
        v-for="(col, colIdx) in columns"
        :key="col.id"
        class="kanban-col"
        :style="col.color ? { borderTop: `3px solid ${col.color}` } : {}"
      >

        <!-- Column header -->
        <div class="col-header">
          <div class="col-title-row">
            <span class="col-drag" title="Drag column">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/><circle cx="10" cy="2" r="1.2"/>
                <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/><circle cx="10" cy="6" r="1.2"/>
                <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/>
              </svg>
            </span>
            <span v-if="!col.editing" class="col-title" @dblclick="startEdit(col)">{{ col.name }}</span>
            <input v-else v-focus class="col-title-input" v-model="col.name"
              @blur="col.editing = false" @keydown.enter="col.editing = false" />
            <span class="col-count">{{ col.cards.length }}</span>
          </div>
          <div class="col-actions">
            <div class="col-color-wrap">
              <button
                class="col-color-btn"
                :style="col.color ? { background: col.color } : {}"
                @click.stop="col.colorOpen = !col.colorOpen"
                title="Column color"
              ></button>
              <div v-if="col.colorOpen" class="col-color-panel">
                <button class="col-swatch swatch-none" :class="{ active: !col.color }" @click="setColColor(col, '')">✕</button>
                <button
                  v-for="c in BORDER_COLORS" :key="c"
                  class="col-swatch"
                  :class="{ active: col.color === c }"
                  :style="{ background: c }"
                  @click="setColColor(col, c)"
                ></button>
              </div>
            </div>
            <button class="col-del" @click="deleteColumn(colIdx)">✕</button>
          </div>
        </div>

        <!-- Cards -->
        <VueDraggable
          v-model="col.cards"
          group="kanban"
          :animation="180"
          ghost-class="card-ghost"
          drag-class="card-dragging"
          class="card-list"
          @end="save"
        >
          <div
            v-for="card in col.cards"
            :key="card.id"
            class="kanban-card"
            @click="openEdit(col, card)"
          >
            <!-- Cover image -->
            <div v-if="card.image" class="card-cover">
              <img :src="card.image" :alt="card.title" />
            </div>

            <div class="card-body">
              <div class="card-content">
                <div class="card-title">{{ card.title }}</div>
                <div v-if="card.desc" class="card-desc">{{ card.desc }}</div>
              </div>
              <button class="card-del" @click.stop="deleteCard(col, card.id)">✕</button>
            </div>
          </div>
        </VueDraggable>

        <!-- Add card button -->
        <button class="add-card-btn" @click="openCreate(col)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add a card
        </button>

      </div>
    </VueDraggable>

    <div class="add-col">
      <button class="add-col-btn" @click="addColumn">+ Add Column</button>
    </div>

    <!-- ── Card modal ──────────────────────────────────────────────── -->
    <transition name="modal-fade">
      <div v-if="modal.open" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">{{ modal.isEdit ? 'Edit Card' : 'New Card' }}</span>
            <button class="modal-close" @click="closeModal">✕</button>
          </div>

          <!-- Cover image preview -->
          <div v-if="modal.image" class="modal-cover">
            <img :src="modal.image" />
            <button class="modal-cover-remove" @click="modal.image = ''">✕</button>
          </div>

          <div class="modal-body">
            <!-- Title -->
            <label class="modal-label">Title</label>
            <input class="modal-input" v-model="modal.title" placeholder="Card title" />

            <!-- Description -->
            <label class="modal-label">Description</label>
            <textarea class="modal-textarea" v-model="modal.desc" placeholder="Add a description…" rows="3"></textarea>

            <!-- Image upload -->
            <label class="modal-label">Cover image</label>
            <div class="modal-img-row">
              <button class="modal-img-btn" @click="imgInput.click()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {{ modal.image ? 'Change image' : 'Upload image' }}
              </button>
              <button v-if="modal.image" class="modal-img-remove" @click="modal.image = ''">Remove</button>
            </div>
            <input ref="imgInput" type="file" accept="image/*" style="display:none" @change="handleImage" />

          </div>

          <div class="modal-footer">
            <button v-if="modal.isEdit" class="modal-btn modal-btn--danger" @click="deleteFromModal">Delete</button>
            <div style="display:flex;gap:8px;margin-left:auto">
              <button class="modal-btn modal-btn--cancel" @click="closeModal">Cancel</button>
              <button class="modal-btn modal-btn--save" @click="saveModal">{{ modal.isEdit ? 'Save' : 'Add Card' }}</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })
const vFocus = { mounted: (el) => el.focus() }

const BORDER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#ffffff',
]

const defaultColumns = [
  { id: 1, name: 'To Do', color: '#f97316', cards: [{ id: 1, title: 'Set up project structure', desc: 'Define folder layout and install dependencies.', image: '' }] },
  { id: 2, name: 'In Progress', color: '#3b82f6', cards: [] },
  { id: 3, name: 'Review', color: '#eab308', cards: [] },
  { id: 4, name: 'Done', color: '#22c55e', cards: [] },
]

const { data: storedColumns, save: persist } = useToolStorage(props.projectId, 'kanban', defaultColumns)

const columns = ref([])
watch(storedColumns, (val) => {
  columns.value = val.map(c => ({ ...c, newCardTitle: '', editing: false, colorOpen: false }))
}, { immediate: true })

function save() {
  const clean = columns.value.map(c => ({ id: c.id, name: c.name, color: c.color || '', cards: c.cards }))
  persist(clean)
}
watch(columns, save, { deep: true })

// ─── Column actions ────────────────────────────────────────────────────────
function addColumn() {
  columns.value.push({ id: Date.now(), name: 'New Column', color: '', cards: [], newCardTitle: '', editing: false, colorOpen: false })
}

function setColColor(col, color) {
  col.color = color
  col.colorOpen = false
  save()
}
function deleteColumn(i) { columns.value.splice(i, 1) }
function startEdit(col) { col.editing = true }

// ─── Card actions ──────────────────────────────────────────────────────────
function deleteCard(col, id) { col.cards = col.cards.filter(c => c.id !== id) }

// ─── Modal state ───────────────────────────────────────────────────────────
const imgInput = ref(null)
const modal = ref({
  open: false,
  isEdit: false,
  col: null,
  card: null,
  title: '',
  desc: '',
  image: '',
  borderColor: '',
})

function openCreate(col) {
  modal.value = { open: true, isEdit: false, col, card: null, title: '', desc: '', image: '' }
}

function openEdit(col, card) {
  modal.value = { open: true, isEdit: true, col, card, title: card.title, desc: card.desc || '', image: card.image || '' }
}

function closeModal() { modal.value.open = false }

function saveModal() {
  if (!modal.value.title.trim()) return
  if (modal.value.isEdit) {
    const c = modal.value.card
    c.title = modal.value.title.trim()
    c.desc = modal.value.desc
    c.image = modal.value.image
  } else {
    modal.value.col.cards.push({
      id: Date.now(),
      title: modal.value.title.trim(),
      desc: modal.value.desc,
      image: modal.value.image,
    })
  }
  save()
  closeModal()
}

function deleteFromModal() {
  deleteCard(modal.value.col, modal.value.card.id)
  closeModal()
}

function handleImage(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => { modal.value.image = ev.target.result }
  reader.readAsDataURL(file)
  e.target.value = ''
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.kanban-board { overflow-x: auto; padding-bottom: 8px; }

.board-columns {
  display: flex;
  gap: 14px;
  min-height: 400px;
  align-items: flex-start;
}

:deep(.col-ghost) {
  opacity: 0.4;
  border: 2px dashed var(--accent) !important;
  background: var(--accent-subtle) !important;
}

// ── Column ──────────────────────────────────────────────────────────────────
.kanban-col {
  width: 256px;
  flex-shrink: 0;
  background: $bg-elevated;
  border-radius: $radius-lg;
  padding: 12px 10px;
}

.col-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.col-title-row { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.col-drag { color: rgba(167,139,250,0.3); cursor: grab; font-size: 14px; flex-shrink: 0; transition: color 0.15s; &:hover { color: $brand-400; } &:active { cursor: grabbing; } }
.col-title { font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.col-title-input { background: $bg-surface; border: 1px solid $brand-500; border-radius: 4px; padding: 3px 6px; font-size: 13px; font-weight: 700; color: #fff; outline: none; width: 120px; }
.col-count { font-size: 10px; font-weight: 600; color: $brand-400; background: $bg-surface; padding: 2px 7px; border-radius: 20px; flex-shrink: 0; }
.col-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.col-del { background: transparent; border: none; color: rgba(167,139,250,0.25); cursor: pointer; font-size: 10px; &:hover { color: #f87171; } }

.col-color-wrap { position: relative; }

.col-color-btn {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(167,139,250,0.3);
  background: $bg-surface;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  &:hover { border-color: $brand-400; transform: scale(1.2); }
}

.col-color-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 136px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  z-index: 50;
}

.col-swatch {
  width: 22px; height: 22px;
  border-radius: 5px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.12s;
  outline: none;
  padding: 0;
  &:hover { transform: scale(1.15); }
  &.active { border-color: #fff; }
}

.swatch-none {
  background: $bg-elevated;
  border-color: var(--border-subtle);
  color: $brand-500;
  font-size: 10px;
  display: flex; align-items: center; justify-content: center;
}

// ── Card list ────────────────────────────────────────────────────────────────
.card-list { min-height: 40px; }

:deep(.card-ghost) {
  opacity: 0;
  border: 2px dashed var(--accent) !important;
  background: var(--accent-subtle) !important;
  border-radius: $radius-md;
  min-height: 60px;
}

:deep(.card-dragging) {
  opacity: 0.96;
  box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px var(--accent) !important;
  transform: rotate(1.5deg) scale(1.02);
  cursor: grabbing !important;
}

// ── Card ─────────────────────────────────────────────────────────────────────
.kanban-card {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  margin-bottom: 8px;
  overflow: hidden;
  cursor: grab;
  transition: box-shadow 0.18s;
  &:active { cursor: grabbing; }
  &:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    .card-del { opacity: 1; }
  }
}

.card-cover {
  width: 100%;
  height: 110px;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}

.card-body {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 10px 10px 8px;
}

.card-content { flex: 1; min-width: 0; }

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  word-break: break-word;
}

.card-desc {
  font-size: 11px;
  color: $brand-400;
  margin-top: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-del {
  background: transparent; border: none;
  color: rgba(167,139,250,0.2); cursor: pointer;
  font-size: 9px; flex-shrink: 0;
  opacity: 0; transition: all 0.2s;
  &:hover { color: #f87171; }
}

// ── Add card button ───────────────────────────────────────────────────────────
.add-card-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
  padding: 7px 8px;
  background: transparent;
  border: 1px dashed transparent;
  border-radius: $radius-sm;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: $brand-500;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: var(--accent-subtle); border-color: var(--accent-subtle); color: $brand-300; }
}

// ── Add column ───────────────────────────────────────────────────────────────
.add-col { display: flex; align-items: flex-start; padding-top: 4px; }
.add-col-btn { padding: 10px 16px; background: transparent; border: 2px dashed var(--accent-subtle); border-radius: $radius-lg; color: $brand-400; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; width: 180px; &:hover { border-color: $brand-500; color: $brand-300; background: var(--accent-subtle); } }

// ── Modal ─────────────────────────────────────────────────────────────────────
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 16px;
}

.modal {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-xl;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title { font-size: 14px; font-weight: 700; color: #fff; }
.modal-close { background: transparent; border: none; color: $brand-400; cursor: pointer; font-size: 14px; &:hover { color: #f87171; } }

.modal-cover {
  position: relative;
  height: 150px;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}

.modal-cover-remove {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,0.5); border: none;
  color: #fff; border-radius: 50%;
  width: 24px; height: 24px;
  font-size: 11px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: rgba(239,68,68,0.8); }
}

.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }

.modal-label { font-size: 11px; font-weight: 600; color: $brand-400; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: -6px; }

.modal-input {
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: 10px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #fff;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  &:focus { border-color: var(--accent); }
  &::placeholder { color: $brand-600; }
}

.modal-textarea {
  @extend .modal-input;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.modal-img-row { display: flex; align-items: center; gap: 8px; }

.modal-img-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300; cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: #fff; }
}

.modal-img-remove {
  background: transparent; border: none;
  font-family: 'Inter', sans-serif;
  font-size: 12px; color: #f87171;
  cursor: pointer; padding: 4px;
}

// ── Color swatches ────────────────────────────────────────────────────────────
.modal-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 28px; height: 28px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
  &:hover { transform: scale(1.15); }
  &.active { border-color: #fff; transform: scale(1.15); box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
}

.swatch-none {
  background: $bg-elevated;
  border-color: var(--border-subtle);
  color: $brand-500;
  font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  &.active { border-color: $brand-400; }
}

// ── Modal footer ──────────────────────────────────────────────────────────────
.modal-footer {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
}

.modal-btn {
  padding: 8px 18px;
  border: none; border-radius: $radius-md;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;

  &--save   { background: var(--accent); color: #fff; &:hover { opacity: 0.85; } }
  &--cancel { background: $bg-elevated; color: $brand-300; &:hover { color: #fff; } }
  &--danger { background: rgba(239,68,68,0.12); color: #f87171; &:hover { background: rgba(239,68,68,0.22); } }
}

// ── Transition ────────────────────────────────────────────────────────────────
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
