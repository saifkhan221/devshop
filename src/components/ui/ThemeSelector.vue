<template>
  <div class="theme-selector" ref="selectorRef">

    <!-- Trigger button -->
    <button class="trigger" @click="open = !open" title="Change theme">
      <span class="trigger-swatch" :style="{ background: triggerAccent }"></span>
      <span class="trigger-label">{{ triggerLabel }}</span>
      <span class="trigger-caret">▾</span>
    </button>

    <!-- Dropdown panel -->
    <transition name="dropdown">
      <div v-if="open" class="panel">

        <!-- Preset themes -->
        <div class="panel-title">Themes</div>
        <div class="theme-grid">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            class="theme-card"
            :class="{ active: activeId === theme.id }"
            @click="selectPreset(theme.id)"
          >
            <div class="preview" :style="{ background: theme.bg }">
              <div class="preview-bar" :style="{ background: theme.accent }"></div>
              <div class="preview-dot" :style="{ background: theme.accent }"></div>
            </div>
            <div class="theme-info">
              <div class="theme-name">{{ theme.name }}</div>
              <div class="theme-desc">{{ theme.desc }}</div>
            </div>
            <span v-if="activeId === theme.id" class="check">✓</span>
          </button>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Custom theme builder -->
        <div class="panel-title">Custom Theme</div>
        <div class="custom-builder" :class="{ active: activeId === 'custom' }">

          <div class="color-row">
            <label class="color-field">
              <span class="color-label">Accent</span>
              <div class="color-pick-row">
                <div class="color-swatch-btn" :style="{ background: customAccent }" @click="$refs.accentInput.click()"></div>
                <span class="color-hex">{{ customAccent }}</span>
              </div>
              <input ref="accentInput" type="color" v-model="customAccent" class="hidden-input" @input="previewCustom" />
            </label>

            <label class="color-field">
              <span class="color-label">Background</span>
              <div class="color-pick-row">
                <div class="color-swatch-btn" :style="{ background: customBg }" @click="$refs.bgInput.click()"></div>
                <span class="color-hex">{{ customBg }}</span>
              </div>
              <input ref="bgInput" type="color" v-model="customBg" class="hidden-input" @input="previewCustom" />
            </label>
          </div>

          <!-- Quick accent presets -->
          <div class="accent-presets">
            <div
              v-for="color in accentPresets"
              :key="color"
              class="accent-dot"
              :style="{ background: color }"
              :class="{ active: customAccent === color }"
              @click="setAccentPreset(color)"
              :title="color"
            ></div>
          </div>

          <button class="apply-btn" @click="applyCustom">
            Apply Custom Theme
          </button>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { THEMES, applyTheme, applyCustomTheme, getSavedTheme, getSavedCustomColors } from '@/utils/theme'

const open       = ref(false)
const activeId   = ref(getSavedTheme())
const selectorRef = ref(null)
const accentInput = ref(null)
const bgInput     = ref(null)

// Custom colour state — pre-fill from localStorage
const savedCustom  = getSavedCustomColors()
const customAccent = ref(savedCustom.accent)
const customBg     = ref(savedCustom.bg)

// Quick accent colour presets
const accentPresets = [
  '#7c3aed', '#6366f1', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6',
  '#0ea5e9', '#14b8a6', '#f97316', '#a855f7',
]

// What shows in the navbar trigger
const triggerLabel = computed(() => {
  if (activeId.value === 'custom') return 'Custom'
  return THEMES.find((t) => t.id === activeId.value)?.name || 'Aurora'
})

const triggerAccent = computed(() => {
  if (activeId.value === 'custom') return customAccent.value
  return THEMES.find((t) => t.id === activeId.value)?.accent || '#7c3aed'
})

function selectPreset(id) {
  activeId.value = id
  applyTheme(id)
  open.value = false
}

// Live preview while dragging color picker
function previewCustom() {
  applyCustomTheme({ accent: customAccent.value, bg: customBg.value })
  activeId.value = 'custom'
}

function setAccentPreset(color) {
  customAccent.value = color
  previewCustom()
}

function applyCustom() {
  applyCustomTheme({ accent: customAccent.value, bg: customBg.value })
  activeId.value = 'custom'
  open.value = false
}

// Close on outside click
function handleOutsideClick(e) {
  if (selectorRef.value && !selectorRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.theme-selector { position: relative; }

.trigger {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;
  font-family: 'Inter', sans-serif;
  &:hover { border-color: var(--accent); }
}

.trigger-swatch {
  width: 12px; height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.trigger-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.trigger-caret { font-size: 10px; color: var(--text-muted); }

.panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 272px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-xl;
  padding: 14px;
  box-shadow: var(--shadow-modal);
  z-index: 200;
  scrollbar-width: thin;
  scrollbar-color: var(--border-subtle) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 4px; }
}

.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.theme-grid { display: flex; flex-direction: column; gap: 3px; margin-bottom: 4px; }

.theme-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  background: transparent;
  cursor: pointer;
  transition: $transition-fast;
  font-family: 'Inter', sans-serif;
  text-align: left;
  position: relative;
  &:hover { background: var(--bg-elevated); border-color: var(--border-subtle); }
  &.active { background: var(--accent-subtle); border-color: var(--accent); }
}

.preview {
  width: 34px; height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}

.preview-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  opacity: 0.9;
}

.preview-dot {
  position: absolute;
  bottom: 4px; left: 5px;
  width: 7px; height: 7px;
  border-radius: 50%;
  opacity: 0.9;
}

.theme-info { flex: 1; }
.theme-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.theme-desc { font-size: 10px; color: var(--text-muted); margin-top: 1px; }

.check { font-size: 11px; font-weight: 700; color: var(--accent); }

.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 12px 0;
}

// Custom theme builder
.custom-builder {
  padding: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  background: var(--bg-elevated);
  transition: border-color 0.2s;
  &.active { border-color: var(--accent); }
}

.color-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.color-field {
  flex: 1;
  cursor: pointer;
}

.color-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.color-pick-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.color-swatch-btn {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.15);
  cursor: pointer;
  transition: transform 0.15s;
  flex-shrink: 0;
  &:hover { transform: scale(1.1); border-color: rgba(255,255,255,0.4); }
}

.color-hex {
  font-size: 11px;
  font-family: monospace;
  color: var(--text-muted);
}

.hidden-input {
  display: none;
}

// Quick accent presets
.accent-presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.accent-dot {
  width: 20px; height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
  &:hover { transform: scale(1.2); }
  &.active {
    border-color: #fff;
    transform: scale(1.15);
  }
}

.apply-btn {
  width: 100%;
  padding: 8px;
  background: var(--accent);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: $transition-fast;
  opacity: 0.9;
  &:hover { opacity: 1; transform: translateY(-1px); }
}

// Dropdown animation
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }
</style>
