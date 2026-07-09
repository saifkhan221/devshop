<template>
  <div class="notes-tool">

    <!-- Header -->
    <div class="notes-header">
      <span class="notes-count">{{ notes.length }} callout{{ notes.length !== 1 ? 's' : '' }}</span>
      <button class="add-btn" @click="addNote">
        <Plus :size="13" />
        Add Callout
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="notes.length === 0" class="notes-empty">
      <div class="empty-icon">📝</div>
      <p>No callouts yet. Add one to get started.</p>
    </div>

    <!-- Draggable notes list -->
    <VueDraggable
      v-model="notes"
      :animation="200"
      handle=".note-drag-handle"
      class="notes-list"
      @update="save"
    >
      <div
        v-for="note in notes"
        :key="note.id"
        class="note-card"
        :style="{ background: note.bg, borderColor: note.border }"
      >
        <!-- Drag handle -->
        <div class="note-drag-handle">
          <GripVertical :size="14" />
        </div>

        <!-- Icon badge (click to open picker) -->
        <div class="note-icon-wrap" @click.stop="toggleIconPicker(note.id)">
          <div class="note-icon-badge" :style="{ background: note.iconBg, color: note.iconColor }">
            <component :is="ICON_MAP[note.iconName] || Info" :size="18" />
          </div>
          <!-- Icon picker dropdown -->
          <transition name="pop">
            <div v-if="iconPickerId === note.id" class="icon-picker" @click.stop>
              <div class="icon-grid">
                <button
                  v-for="ic in ICON_KEYS"
                  :key="ic"
                  class="icon-opt"
                  :class="{ active: note.iconName === ic }"
                  :title="ic"
                  @click="setIcon(note, ic)"
                >
                  <component :is="ICON_MAP[ic]" :size="18" />
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- Text -->
        <div
          class="note-text"
          contenteditable="true"
          data-placeholder="Write a callout…"
          @input="onTextInput(note, $event)"
          @keydown.enter.prevent="$event.target.blur()"
          v-init-text="note.text"
        />

        <!-- Right controls -->
        <div class="note-controls">
          <!-- Color swatches (visible on hover) -->
          <div class="swatches">
            <button
              v-for="c in COLORS"
              :key="c.id"
              class="swatch"
              :class="{ active: note.colorId === c.id }"
              :style="{ background: c.swatch }"
              :title="c.label"
              @click="setColor(note, c)"
            />
            <!-- Custom color -->
            <label class="swatch swatch--custom" title="Custom color">
              <Plus :size="8" />
              <input type="color" class="hidden-color" @change="setCustomColor(note, $event.target.value)" />
            </label>
          </div>

          <!-- Delete -->
          <button class="note-delete" @click="deleteNote(note.id)" title="Delete">
            <X :size="12" />
          </button>
        </div>
      </div>
    </VueDraggable>

    <!-- Backdrop to close icon picker -->
    <teleport to="body">
      <div v-if="iconPickerId" class="icon-picker-backdrop" @click="iconPickerId = null" />
    </teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

// Custom directive: sets innerText once on mount (avoids Vue fighting user edits)
const vInitText = {
  mounted(el, binding) {
    el.innerText = binding.value || ''
  },
}
import { useToolStorage } from '@/composables/useToolStorage'
import {
  Info, TriangleAlert, CircleCheck, CircleX, Lightbulb,
  Pin, MessageSquare, Star, Flame, Target, Rocket, Key,
  FileText, Brain, Eye, Ban, Bookmark, Bell, Zap, Heart,
  Lock, Tag, Flag, Coffee,
  GripVertical, Plus, X,
} from '@lucide/vue'

const props = defineProps({ projectId: String })
const { data: notes, save } = useToolStorage(props.projectId, 'project-notes', [])

// ── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP = {
  Info, TriangleAlert, CircleCheck, CircleX, Lightbulb, Pin,
  MessageSquare, Star, Flame, Target, Rocket, Key,
  FileText, Brain, Eye, Ban, Bookmark, Bell,
  Zap, Heart, Lock, Tag, Flag, Coffee,
}
// 24 icons → 4 rows × 6 cols, perfect grid
const ICON_KEYS = Object.keys(ICON_MAP)

// ── Color presets ────────────────────────────────────────────────────────────
const COLORS = [
  { id: 'blue',   label: 'Info',    swatch: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  iconBg: 'rgba(59,130,246,0.2)',  iconColor: '#3b82f6',  icon: 'Info'          },
  { id: 'yellow', label: 'Warning', swatch: '#eab308', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',   iconBg: 'rgba(234,179,8,0.2)',   iconColor: '#eab308',  icon: 'TriangleAlert' },
  { id: 'green',  label: 'Success', swatch: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   iconBg: 'rgba(34,197,94,0.2)',   iconColor: '#22c55e',  icon: 'CircleCheck'   },
  { id: 'red',    label: 'Danger',  swatch: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   iconBg: 'rgba(239,68,68,0.2)',   iconColor: '#ef4444',  icon: 'CircleX'       },
  { id: 'purple', label: 'Tip',     swatch: '#a855f7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)', iconBg: 'rgba(168,85,247,0.2)',  iconColor: '#a855f7',  icon: 'Lightbulb'     },
  { id: 'orange', label: 'Note',    swatch: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)', iconBg: 'rgba(249,115,22,0.2)',  iconColor: '#f97316',  icon: 'Pin'           },
  { id: 'teal',   label: 'Note',    swatch: '#14b8a6', bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.25)', iconBg: 'rgba(20,184,166,0.2)',  iconColor: '#14b8a6',  icon: 'MessageSquare' },
  { id: 'pink',   label: 'Star',    swatch: '#ec4899', bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.25)', iconBg: 'rgba(236,72,153,0.2)',  iconColor: '#ec4899',  icon: 'Star'          },
]

const DEFAULT_COLOR = COLORS[0]

// ── State ─────────────────────────────────────────────────────────────────────
const iconPickerId = ref(null)

function toggleIconPicker(id) {
  iconPickerId.value = iconPickerId.value === id ? null : id
}

function setIcon(note, iconName) {
  note.iconName = iconName
  iconPickerId.value = null
  save()
}

function setColor(note, c) {
  note.colorId   = c.id
  note.bg        = c.bg
  note.border    = c.border
  note.iconBg    = c.iconBg
  note.iconColor = c.iconColor
  // Only auto-switch icon if it's still a preset default
  const isDefaultIcon = COLORS.some(col => col.icon === note.iconName)
  if (isDefaultIcon) note.iconName = c.icon
  save()
}

function setCustomColor(note, hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  note.colorId   = 'custom'
  note.bg        = `rgba(${r},${g},${b},0.1)`
  note.border    = `rgba(${r},${g},${b},0.28)`
  note.iconBg    = `rgba(${r},${g},${b},0.2)`
  note.iconColor = hex
  save()
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
function addNote() {
  notes.value.unshift({
    id:        Date.now(),
    iconName:  DEFAULT_COLOR.icon,
    iconBg:    DEFAULT_COLOR.iconBg,
    iconColor: DEFAULT_COLOR.iconColor,
    text:      '',
    colorId:   DEFAULT_COLOR.id,
    bg:        DEFAULT_COLOR.bg,
    border:    DEFAULT_COLOR.border,
  })
  save()
}

function deleteNote(id) {
  notes.value = notes.value.filter(n => n.id !== id)
  save()
}

// ── Text input ────────────────────────────────────────────────────────────────
function onTextInput(note, e) {
  note.text = e.target.innerText
  save()
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.notes-tool { display: flex; flex-direction: column; gap: 16px; }

// ── Header ───────────────────────────────────────────────────────────────────
.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notes-count { font-size: 12px; color: $brand-400; }

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

// ── Empty ─────────────────────────────────────────────────────────────────────
.notes-empty {
  text-align: center;
  padding: 48px 24px;
  color: $brand-400;
  .empty-icon { font-size: 36px; margin-bottom: 12px; }
  p { font-size: 13px; margin: 0; }
}

// ── Notes list ────────────────────────────────────────────────────────────────
.notes-list { display: flex; flex-direction: column; gap: 10px; }

// ── Note card ─────────────────────────────────────────────────────────────────
.note-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 8px;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: border-color 0.15s;
  position: relative;
  z-index: 1;
  cursor: default;

  &:hover .note-delete  { opacity: 1; }
  &:hover .swatches     { opacity: 1; }

  // Card with open picker floats above its siblings
  &:has(.icon-picker) { z-index: 10; }
}

// ── Drag handle ───────────────────────────────────────────────────────────────
.note-drag-handle {
  display: flex; align-items: center;
  color: rgba(255,255,255,0.2);
  cursor: grab;
  flex-shrink: 0;
  transition: color 0.15s;
  &:hover { color: rgba(255,255,255,0.45); }
  &:active { cursor: grabbing; }
}

// ── Icon badge ────────────────────────────────────────────────────────────────
.note-icon-wrap {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}

.note-icon-badge {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, filter 0.15s;
  flex-shrink: 0;
  &:hover { transform: scale(1.1); filter: brightness(1.15); }
}

// ── Icon picker ───────────────────────────────────────────────────────────────
.icon-picker {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 200;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  width: 214px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.icon-opt {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: $brand-300;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  &:hover  { background: $bg-elevated; color: #fff; }
  &.active { border-color: var(--accent); background: var(--accent-subtle); color: var(--accent); }
}

.icon-picker-backdrop { position: fixed; inset: 0; z-index: 199; }

// ── Text ──────────────────────────────────────────────────────────────────────
.note-text {
  flex: 1;
  min-width: 0;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  color: rgba(255,255,255,0.88);
  outline: none;
  word-break: break-word;
  white-space: pre-wrap;

  // Placeholder via pseudo-element
  &:empty::before {
    content: attr(data-placeholder);
    color: rgba(255,255,255,0.3);
    pointer-events: none;
  }
}

// ── Controls ──────────────────────────────────────────────────────────────────
.note-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.swatches {
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.swatch {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s, border-color 0.15s;
  &:hover { transform: scale(1.25); }
  &.active { border-color: #fff; transform: scale(1.15); }

  &--custom {
    background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.9);
    cursor: pointer;
  }
}

.hidden-color {
  position: absolute;
  width: 0; height: 0;
  opacity: 0;
  pointer-events: none;
}

.note-delete {
  width: 22px; height: 22px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.3);
  cursor: pointer;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
  &:hover { color: #f87171; background: rgba(239,68,68,0.12); }
}

// ── Animations ────────────────────────────────────────────────────────────────
.pop-enter-active, .pop-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.96); }
</style>
