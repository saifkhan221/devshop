<template>
  <div class="contrast-checker">
    <div class="color-pickers">
      <div class="picker-group">
        <label>Foreground Color</label>
        <div class="picker-row">
          <input type="color" v-model="fg" class="color-input" />
          <input type="text" v-model="fg" class="hex-input" placeholder="#ffffff" />
        </div>
      </div>
      <div class="picker-group">
        <label>Background Color</label>
        <div class="picker-row">
          <input type="color" v-model="bg" class="color-input" />
          <input type="text" v-model="bg" class="hex-input" placeholder="#000000" />
        </div>
      </div>
    </div>

    <div class="preview-box" :style="{ background: bg, color: fg }">
      <div class="preview-heading" :style="{ color: fg }">The quick brown fox</div>
      <div class="preview-body" :style="{ color: fg }">jumps over the lazy dog. 1234567890</div>
    </div>

    <div class="ratio-display">
      <div class="ratio-value">{{ ratio }}</div>
      <div class="ratio-label">Contrast Ratio</div>
    </div>

    <div class="wcag-results">
      <div class="wcag-row" v-for="row in wcagResults" :key="row.label">
        <span class="wcag-label">{{ row.label }}</span>
        <span class="wcag-badge" :class="row.pass ? 'pass' : 'fail'">{{ row.pass ? 'AA Pass' : 'AA Fail' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ projectId: String })

const fg = ref('#ffffff')
const bg = ref('#160d30')

function getLuminance(hex) {
  const rgb = hex.length === 4
    ? [parseInt(hex[1]+hex[1],16), parseInt(hex[2]+hex[2],16), parseInt(hex[3]+hex[3],16)]
    : [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
  return rgb.map(v => {
    v /= 255
    return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4
  }).reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0)
}

const ratio = computed(() => {
  try {
    const l1 = getLuminance(fg.value)
    const l2 = getLuminance(bg.value)
    const r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    return r.toFixed(2) + ':1'
  } catch { return 'N/A' }
})

const numRatio = computed(() => {
  try { return parseFloat(ratio.value) } catch { return 0 }
})

const wcagResults = computed(() => [
  { label: 'Normal Text (AA ≥ 4.5:1)', pass: numRatio.value >= 4.5 },
  { label: 'Large Text (AA ≥ 3:1)', pass: numRatio.value >= 3 },
  { label: 'Normal Text (AAA ≥ 7:1)', pass: numRatio.value >= 7 },
  { label: 'Large Text (AAA ≥ 4.5:1)', pass: numRatio.value >= 4.5 },
])
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.color-pickers { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }

.picker-group { label { display: block; font-size: 12px; font-weight: 500; color: $brand-300; margin-bottom: 8px; } }

.picker-row { display: flex; gap: 8px; align-items: center; }

.color-input { width: 44px; height: 38px; border: none; border-radius: $radius-sm; cursor: pointer; background: transparent; padding: 0; }

.hex-input { flex: 1; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; padding: 8px 12px; font-family: monospace; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } }

.preview-box { border-radius: $radius-lg; padding: 28px; margin-bottom: 20px; min-height: 100px; transition: all 0.2s; }
.preview-heading { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.preview-body { font-size: 14px; opacity: 0.9; }

.ratio-display { text-align: center; padding: 24px; background: $bg-elevated; border-radius: $radius-lg; margin-bottom: 20px; }
.ratio-value { font-size: 48px; font-weight: 700; color: #fff; letter-spacing: -2px; }
.ratio-label { font-size: 13px; color: $brand-400; margin-top: 4px; }

.wcag-results { display: flex; flex-direction: column; gap: 8px; }

.wcag-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: $bg-elevated; border-radius: $radius-md; }

.wcag-label { font-size: 13px; color: $brand-300; }

.wcag-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; &.pass { background: rgba(16,185,129,0.15); color: #6ee7b7; } &.fail { background: rgba(239,68,68,0.12); color: #f87171; } }
</style>
