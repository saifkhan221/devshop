<template>
  <button
    :class="['app-btn', `app-btn--${variant}`, `app-btn--${size}`, { 'app-btn--loading': loading }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="app-btn__spinner"></span>
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: $radius-md;

  &--sm { padding: 6px 14px; font-size: 12px; }
  &--md { padding: 9px 20px; font-size: 13px; }
  &--lg { padding: 12px 24px; font-size: 14px; }

  &--primary {
    background: linear-gradient(135deg, $brand-600, $brand-500);
    color: white;
    box-shadow: 0 2px 10px var(--accent-glow);
    &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px var(--accent-glow); }
  }

  &--ghost {
    background: $brand-800;
    color: $brand-300;
    &:hover:not(:disabled) { background: $brand-700; color: #fff; }
  }

  &--danger {
    background: rgba(239,68,68,0.15);
    color: #f87171;
    border: 1px solid rgba(239,68,68,0.3);
    &:hover:not(:disabled) { background: rgba(239,68,68,0.25); }
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &__spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
