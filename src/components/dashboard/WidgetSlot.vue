<template>
  <div class="widget-slot" ref="root" @keydown.esc="open = false">
    <slot />
    <div class="ws-switch" :class="{ 'is-open': open }">
      <button
        type="button" class="ws-btn"
        aria-haspopup="menu" :aria-expanded="open"
        aria-label="Change widget" title="Change widget"
        @click.stop="open = !open"
      >
        <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>
      </button>
      <div v-if="open" class="ds-menu ws-menu" role="menu">
        <div class="ds-menu-heading">Show here</div>
        <button
          v-for="w in options" :key="w.key"
          type="button" class="ds-menu-item"
          role="menuitemradio" :aria-checked="w.key === modelValue"
          @click="pick(w.key)"
        >
          <svg v-if="w.key === modelValue" class="ds-icon ws-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>
          <span v-else class="ws-check-space"></span>
          {{ w.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  modelValue: { type: String, required: true },
  options:    { type: Array, required: true },   // [{ key, label }]
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const root = ref(null)

function pick(key) {
  emit('update:modelValue', key)
  open.value = false
}

function onOutside(e) { if (root.value && !root.value.contains(e.target)) open.value = false }
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
</script>

<style lang="scss" scoped>
// One-cell grid so the slotted card stretches to the row height like its siblings.
.widget-slot { position: relative; display: grid; grid-template-rows: 1fr; min-width: 0; }

.ws-switch {
  position: absolute; top: -10px; right: -10px; z-index: 2;
  opacity: 0; transition: opacity 120ms;
}
.widget-slot:hover .ws-switch,
.widget-slot:focus-within .ws-switch,
.ws-switch.is-open { opacity: 1; }
@media (hover: none) { .ws-switch { opacity: 1; } }

.ws-btn {
  width: 26px; height: 26px;
  display: grid; place-items: center;
  border-radius: var(--radius-full);
  border: 1px solid var(--line-strong);
  background: var(--bg-200);
  color: var(--ink-muted);
  box-shadow: var(--shadow-raised);
  cursor: pointer;
  transition: color 120ms, border-color 120ms;
  &:hover, .is-open & { color: var(--peach-text); border-color: var(--peach); }
  &:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
}

.ws-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: var(--z-dropdown); }
.ws-check { width: 16px; height: 16px; color: var(--peach-text); }
.ws-check-space { width: 16px; flex: none; }
</style>
