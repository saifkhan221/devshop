<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
      >
        <span class="toast-icon">{{ typeIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="remove(toast.id)">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const toasts = computed(() => store.state.ui.toasts)

function remove(id) {
  store.commit('ui/REMOVE_TOAST', id)
}

function typeIcon(type) {
  if (type === 'success') return '✅'
  if (type === 'error') return '❌'
  return 'ℹ️'
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: $radius-md;
  font-size: 13px;
  font-weight: 500;
  min-width: 260px;
  max-width: 380px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);

  &--success { background: #064e3b; color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
  &--error { background: #450a0a; color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
  &--info { background: $bg-elevated; color: $brand-300; border: 1px solid $border-subtle; }
}

.toast-icon { font-size: 14px; flex-shrink: 0; }

.toast-message { flex: 1; }

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  font-size: 11px;
  flex-shrink: 0;
  &:hover { opacity: 1; }
}
</style>
