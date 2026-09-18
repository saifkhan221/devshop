<template>
  <div class="pd-tool">

    <!-- Header -->
    <div class="pd-header">
      <span class="pd-count">{{ items.length }} field{{ items.length !== 1 ? 's' : '' }}</span>

      <div class="pd-head-actions">
        <div v-if="mode === 'edit'" class="pd-add" ref="addRef">
          <button class="add-btn" @click="menuOpen = !menuOpen">
            <Plus :size="14" />
            Add Field
            <ChevronDown :size="13" class="add-caret" :class="{ open: menuOpen }" />
          </button>
          <transition name="pop">
            <div v-if="menuOpen" class="pd-menu">
              <button
                v-for="ft in FIELD_TYPES" :key="ft.type"
                class="pd-menu-item"
                @click="addField(ft.type)"
              >
                <component :is="ft.icon" :size="15" />
                {{ ft.label }}
              </button>
              <div class="pd-menu-div"></div>
              <button class="pd-menu-item" @click="addRow()">
                <Columns2 :size="15" />
                Two in a row
              </button>
            </div>
          </transition>
        </div>

        <button
          class="mode-btn"
          :class="{ 'mode-btn--done': mode === 'edit' }"
          @click="mode = mode === 'edit' ? 'view' : 'edit'"
        >
          <component :is="mode === 'edit' ? Check : Pencil" :size="14" />
          {{ mode === 'edit' ? 'Done' : 'Edit' }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="items.length === 0" class="pd-empty">
      <div class="empty-icon">🗂️</div>
      <p>No details yet.</p>
      <button class="mode-btn mode-btn--ghost" @click="mode = 'edit'">
        <Plus :size="14" /> Add a field
      </button>
    </div>

    <!-- Edit mode: field builder -->
    <VueDraggable
      v-else-if="mode === 'edit'"
      v-model="items"
      :animation="200"
      handle=".pd-drag"
      class="pd-grid"
      @update="save"
    >
      <div
        v-for="item in items" :key="item.id"
        class="pd-item"
        :class="{ 'pd-item--half': item.width === 'half' }"
      >
        <div class="pd-item-top">
          <span class="pd-drag" title="Drag to reorder">
            <GripVertical :size="14" />
          </span>
          <input
            class="pd-label"
            v-model="item.label"
            placeholder="Label"
            @input="save"
          />
          <div class="pd-item-ctrls">
            <select class="pd-type" v-model="item.type" @change="save" title="Field type">
              <option value="date">Date</option>
              <option value="text">Text</option>
              <option value="link">Link</option>
              <option value="textarea">Text Area</option>
            </select>
            <button
              class="pd-ctrl"
              @click="toggleWidth(item)"
              :title="item.width === 'half' ? 'Make full width' : 'Make half width'"
            >
              <component :is="item.width === 'half' ? Columns2 : Square" :size="13" />
            </button>
            <button class="pd-ctrl pd-del" @click="removeItem(item.id)" title="Delete field">
              <X :size="13" />
            </button>
          </div>
        </div>

        <!-- Value input, per type -->
        <input
          v-if="item.type === 'date'"
          type="date"
          class="pd-input"
          v-model="item.value"
          @input="save"
        />
        <textarea
          v-else-if="item.type === 'textarea'"
          class="pd-input pd-textarea"
          rows="3"
          v-model="item.value"
          @input="save"
          placeholder="Enter text…"
        />
        <div v-else-if="item.type === 'link'" class="pd-link-wrap">
          <input
            type="url"
            class="pd-input"
            v-model="item.value"
            @input="save"
            placeholder="https://…"
          />
          <a
            v-if="item.value"
            :href="item.value"
            target="_blank"
            rel="noopener noreferrer"
            class="pd-link-open"
            title="Open link"
          >
            <ExternalLink :size="13" />
          </a>
        </div>
        <input
          v-else
          type="text"
          class="pd-input"
          v-model="item.value"
          @input="save"
          placeholder="Enter text…"
        />
      </div>
    </VueDraggable>

    <!-- View mode: sleek read-only summary -->
    <div v-else class="pv-grid">
      <div
        v-for="item in items" :key="item.id"
        class="pv-item"
        :class="{ 'pv-item--half': item.width === 'half' }"
      >
        <span class="pv-label">{{ item.label || 'Untitled' }}</span>
        <a
          v-if="item.type === 'link' && item.value"
          :href="item.value" target="_blank" rel="noopener noreferrer"
          class="pv-value pv-link"
        >{{ displayLink(item.value) }}</a>
        <span
          v-else
          class="pv-value"
          :class="{
            'pv-value--empty': !item.value,
            'pv-value--multiline': item.type === 'textarea' && item.value,
          }"
        >{{ item.type === 'date' ? (formatDate(item.value) || '—') : (item.value || '—') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useToolStorage } from '@/composables/useToolStorage'
import {
  Plus, X, ChevronDown, Calendar, Type, Link as LinkIcon,
  AlignLeft, Columns2, Square, ExternalLink, GripVertical,
  Pencil, Check,
} from '@lucide/vue'

const props = defineProps({ projectId: String })

// ── Default layout: planned dates on the left, actuals on the right ──────────
const DEFAULTS = [
  { id: 'd-plan-start',   type: 'date', label: 'Project Start Date',        value: '', width: 'half' },
  { id: 'd-actual-start', type: 'date', label: 'Actual Project Start Date', value: '', width: 'half' },
  { id: 'd-plan-end',     type: 'date', label: 'Project End Date',          value: '', width: 'half' },
  { id: 'd-actual-end',   type: 'date', label: 'Actual Project End Date',   value: '', width: 'half' },
]

const { data: items, save } = useToolStorage(props.projectId, 'project-details', DEFAULTS)

// ── Add-menu field types ─────────────────────────────────────────────────────
const FIELD_TYPES = [
  { type: 'date',     label: 'Date',      icon: Calendar },
  { type: 'text',     label: 'Text',      icon: Type },
  { type: 'link',     label: 'Link',      icon: LinkIcon },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft },
]

const menuOpen = ref(false)
const addRef   = ref(null)
const mode     = ref('view')   // 'view' | 'edit'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── View-mode formatting ─────────────────────────────────────────────────────
function formatDate(v) {
  if (!v) return ''
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function displayLink(v) {
  return v.replace(/^https?:\/\//, '')
}

function addField(type) {
  items.value.push({ id: uid(), type, label: '', value: '', width: 'full' })
  menuOpen.value = false
  save()
}

// "Two in a row" → two half-width fields sitting side by side
function addRow() {
  items.value.push(
    { id: uid(), type: 'text', label: '', value: '', width: 'half' },
    { id: uid(), type: 'text', label: '', value: '', width: 'half' },
  )
  menuOpen.value = false
  save()
}

function toggleWidth(item) {
  item.width = item.width === 'half' ? 'full' : 'half'
  save()
}

function removeItem(id) {
  items.value = items.value.filter(i => i.id !== id)
  save()
}

// Close add menu on outside click / escape
function onOutside(e) {
  if (addRef.value && !addRef.value.contains(e.target)) menuOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.pd-tool { display: flex; flex-direction: column; gap: 16px; }

// ── Header ───────────────────────────────────────────────────────────────────
.pd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pd-count { font-size: 12px; color: $brand-400; }

.pd-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-strong);
  border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--accent); color: #fff; }

  &--done {
    background: $brand-600;
    border-color: transparent;
    color: #fff;
    &:hover { background: $brand-500; color: #fff; }
  }
  &--ghost { margin-top: 16px; }
}

.pd-add { position: relative; }

.add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: $brand-600;
  border: none; border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
  &:hover { background: $brand-500; }
}

.add-caret { transition: transform 0.2s; &.open { transform: rotate(180deg); } }

// ── Add menu ─────────────────────────────────────────────────────────────────
.pd-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 180px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  z-index: 30;
}

.pd-menu-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%;
  padding: 9px 12px;
  background: transparent;
  border: none; border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  &:hover { background: $bg-elevated; color: #fff; }
}

.pd-menu-div {
  height: 1px;
  background: var(--border-subtle);
  margin: 5px 4px;
}

// ── Empty ─────────────────────────────────────────────────────────────────────
.pd-empty {
  text-align: center;
  padding: 48px 24px;
  color: $brand-400;
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  p { font-size: 13px; margin: 0; }
}

// ── Field grid ─────────────────────────────────────────────────────────────────
.pd-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.pd-item {
  flex: 1 1 100%;
  min-width: 0;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 14px 14px;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--border-strong);
    .pd-item-ctrls { opacity: 1; }
  }

  &--half { flex: 0 1 calc(50% - 7px); }
}

.pd-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.pd-drag {
  display: flex;
  align-items: center;
  color: rgba(255,255,255,0.18);
  cursor: grab;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: rgba(255,255,255,0.45); }
  &:active { cursor: grabbing; }
}

// Ghost / chosen states while dragging
.pd-item.sortable-ghost { opacity: 0.4; }
.pd-item.sortable-chosen { border-color: var(--accent); }

.pd-label {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  padding: 2px 0;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: $brand-300;
  letter-spacing: 0.01em;
  outline: none;
  &::placeholder { color: rgba(167,139,250,.35); font-weight: 500; }
  &:focus { color: $text-heading; }
}

.pd-item-ctrls {
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.pd-type {
  background: $bg-surface;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  padding: 3px 6px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
  &:hover, &:focus { border-color: var(--accent); }
}

.pd-ctrl {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  background: $bg-surface;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  color: $brand-300;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: var(--accent); color: #fff; }
  &.pd-del:hover { border-color: rgba(239,68,68,.4); color: #f87171; background: rgba(239,68,68,.12); }
}

// ── Value inputs ────────────────────────────────────────────────────────────────
.pd-input {
  width: 100%;
  background: $bg-surface;
  border: 1px solid var(--border-strong);
  border-radius: $radius-md;
  padding: 9px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #fff;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: var(--accent); }
  &::placeholder { color: rgba(167,139,250,.35); }
}

.pd-textarea { resize: vertical; line-height: 1.5; min-height: 68px; }

// Style the native date picker to fit the dark theme
input.pd-input[type="date"] {
  color-scheme: dark;
  cursor: text;
}

.pd-link-wrap {
  position: relative;
  display: flex;
  align-items: center;
  .pd-input { padding-right: 36px; }
}

.pd-link-open {
  position: absolute;
  right: 8px;
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  color: var(--accent);
  border-radius: 6px;
  transition: background 0.15s;
  &:hover { background: var(--accent-subtle); }
}

// ── View mode (sleek, read-only) ────────────────────────────────────────────────
.pv-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0 40px;
}

.pv-item {
  flex: 1 1 100%;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 11px 2px;
  border-bottom: 1px solid var(--border-subtle);

  &--half { flex: 0 1 calc(50% - 20px); }
}

.pv-label {
  font-size: 13px;
  font-weight: 600;
  color: $brand-300;
  flex-shrink: 0;
  &::after { content: ':'; }
}

.pv-value {
  font-size: 13px;
  font-weight: 500;
  color: $text-heading;
  word-break: break-word;

  &--empty { color: $text-muted; font-weight: 400; }
  &--multiline { white-space: pre-wrap; line-height: 1.5; }
}

.pv-link {
  color: var(--accent);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

// ── Responsive ────────────────────────────────────────────────────────────────
@media (max-width: 640px) {
  .pd-item--half,
  .pv-item--half { flex: 1 1 100%; }
}
</style>
