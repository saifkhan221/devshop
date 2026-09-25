<template>
  <teleport to="body">
    <transition name="modal">
      <div v-if="show" class="ds-scrim" @click.self="$emit('close')">
        <div class="ds-modal app-modal" role="dialog" aria-modal="true" :aria-label="title || 'Dialog'">
          <div v-if="title" class="app-modal-head">
            <h2 class="ds-modal-title">{{ title }}</h2>
            <button class="ds-icon-btn ds-icon-btn-sm" @click="$emit('close')" aria-label="Close">
              <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>
          <div class="ds-modal-body app-modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="ds-modal-actions">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: String
})
defineEmits(['close'])
</script>

<style lang="scss" scoped>
.app-modal { position: relative; max-width: 560px; max-height: calc(100vh - var(--space-8)); display: flex; flex-direction: column; }
.app-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.app-modal-head .ds-modal-title { margin: 0; }
.app-modal-body { overflow: auto; color: var(--ink); }
</style>
