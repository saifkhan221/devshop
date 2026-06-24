<template>
  <div class="border-radius-gen">
    <div class="preview-area">
      <div class="preview-box" :style="{ borderRadius: cssValue }"></div>
    </div>

    <div class="uniform-toggle">
      <label class="toggle-label">
        <input type="checkbox" v-model="uniform" class="toggle-check" />
        Uniform (all corners)
      </label>
    </div>

    <div class="corners-grid">
      <div v-if="uniform" class="corner-control full-width">
        <label>All corners: {{ corners[0] }}%</label>
        <input type="range" v-model.number="corners[0]" min="0" max="50" @input="syncAll" />
      </div>
      <template v-else>
        <div class="corner-control" v-for="(label, i) in cornerLabels" :key="i">
          <label>{{ label }}: {{ corners[i] }}%</label>
          <input type="range" v-model.number="corners[i]" min="0" max="50" />
        </div>
      </template>
    </div>

    <div class="css-output">
      <div class="css-header">
        <div class="css-label">CSS Output</div>
        <button class="copy-btn" @click="copyCSS">{{ copied ? 'Copied!' : 'Copy CSS' }}</button>
      </div>
      <code>border-radius: {{ cssValue }};</code>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const { data, save } = useToolStorage(props.projectId, 'border-radius', {
  uniform: true,
  corners: [12, 12, 12, 12],
})

const uniform = computed({ get: () => data.value.uniform, set: v => { data.value.uniform = v; save() } })
const corners = computed({ get: () => data.value.corners, set: v => { data.value.corners = v; save() } })

watch(() => data.value.corners, () => save(), { deep: true })

const copied = ref(false)

const cornerLabels = ['Top Left', 'Top Right', 'Bottom Right', 'Bottom Left']

function syncAll() {
  const v = corners.value[0]
  corners.value = [v, v, v, v]
}

const cssValue = computed(() => {
  if (uniform.value) return `${corners.value[0]}%`
  return `${corners.value[0]}% ${corners.value[1]}% ${corners.value[2]}% ${corners.value[3]}%`
})

async function copyCSS() {
  await navigator.clipboard.writeText(`border-radius: ${cssValue.value};`)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.preview-area { display: flex; align-items: center; justify-content: center; padding: 40px; background: $bg-elevated; border-radius: $radius-lg; margin-bottom: 24px; }
.preview-box { width: 140px; height: 140px; background: linear-gradient(135deg, $brand-600, $brand-500); transition: border-radius 0.2s; }

.uniform-toggle { margin-bottom: 20px; }
.toggle-label { display: flex; align-items: center; gap: 10px; font-size: 13px; color: $brand-300; cursor: pointer; }
.toggle-check { accent-color: $brand-500; width: 16px; height: 16px; }

.corners-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.corner-control { &.full-width { grid-column: 1 / -1; } label { display: block; font-size: 12px; color: $brand-300; margin-bottom: 6px; } input[type="range"] { width: 100%; accent-color: $brand-500; } }

.css-output { background: $bg-elevated; border-radius: $radius-md; padding: 16px; }
.css-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.css-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; }
code { font-size: 13px; color: $brand-300; font-family: monospace; }
.copy-btn { padding: 6px 14px; background: $brand-600; border: none; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; &:hover { background: $brand-500; } }
</style>
