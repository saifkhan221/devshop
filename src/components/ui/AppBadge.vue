<template>
  <span class="app-badge" :style="color ? { background: hexToRgba(color, 0.15), color: color } : {}">
    {{ label }}
  </span>
</template>

<script setup>
const props = defineProps({
  label: String,
  color: String
})

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-badge {
  display: inline-flex;
  align-items: center;
  background: $bg-elevated;
  color: $brand-300;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 20px;
}
</style>
