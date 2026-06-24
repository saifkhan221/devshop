<template>
  <div class="rem-to-px">
    <div class="converter-grid">
      <div class="input-group">
        <label>REM</label>
        <input class="big-input" type="number" v-model="rem" placeholder="1" step="0.125" />
      </div>
      <div class="arrow-icon">→</div>
      <div class="input-group">
        <label>Pixels (px)</label>
        <div class="big-output">{{ pxValue }} px</div>
      </div>
    </div>

    <div class="base-row">
      <span class="base-label">Base font size:</span>
      <select class="base-select" v-model="base">
        <option value="16">16px (default)</option>
        <option value="14">14px</option>
        <option value="18">18px</option>
        <option value="10">10px</option>
      </select>
      <button class="copy-btn" @click="copyResult">{{ copied ? 'Copied!' : 'Copy Value' }}</button>
    </div>

    <div class="section-title">Quick Reference</div>
    <table class="ref-table">
      <thead>
        <tr><th>REM</th><th>Pixels (base {{ base }})</th><th>Common use</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in quickRef" :key="row.rem">
          <td class="rem-val">{{ row.rem }}rem</td>
          <td class="px-val">{{ (row.rem * base) }}px</td>
          <td class="use-val">{{ row.use }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ projectId: String })

const rem = ref(1)
const base = ref(16)
const copied = ref(false)

const pxValue = computed(() => {
  return Math.round((parseFloat(rem.value) || 0) * base.value)
})

async function copyResult() {
  await navigator.clipboard.writeText(`${pxValue.value}px`)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

const quickRef = [
  { rem: 0.5, use: 'Extra small' },
  { rem: 0.75, use: 'Small labels' },
  { rem: 0.875, use: 'Body small' },
  { rem: 1, use: 'Base / body' },
  { rem: 1.25, use: 'Subheadings' },
  { rem: 1.5, use: 'Headings' },
  { rem: 2, use: 'Large headings' },
  { rem: 3, use: 'Display' },
]
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
.converter-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; margin-bottom: 28px; }
.input-group label { display: block; font-size: 11px; font-weight: 600; color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
.big-input { width: 100%; background: $bg-elevated; border: 2px solid var(--border-strong); border-radius: 12px; padding: 16px 18px; font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 600; color: #fff; outline: none; transition: border-color 0.2s; &:focus { border-color: $brand-500; } &::placeholder { color: rgba(167,139,250,0.25); } }
.big-output { background: var(--accent-subtle); border: 2px solid var(--accent-subtle); border-radius: 12px; padding: 16px 18px; font-size: 28px; font-weight: 600; color: $brand-300; min-height: 72px; display: flex; align-items: center; }
.arrow-icon { font-size: 24px; color: $brand-600; display: flex; align-items: center; justify-content: center; padding-top: 24px; }
.base-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: $bg-elevated; border-radius: $radius-md; margin-bottom: 24px; }
.base-label { font-size: 13px; color: $brand-400; }
.base-select { background: $brand-700; border: 1px solid var(--border-strong); border-radius: 8px; padding: 5px 10px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; }
.copy-btn { margin-left: auto; padding: 6px 14px; background: $brand-600; border: none; border-radius: 8px; color: #fff; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background: $brand-500; } }
.section-title { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }
.ref-table { width: 100%; border-collapse: collapse; }
.ref-table th { text-align: left; font-size: 11px; font-weight: 600; color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase; padding: 0 12px 10px; }
.ref-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--border-subtle); }
.ref-table tr:last-child td { border-bottom: none; }
.rem-val { color: #fff; font-weight: 600; font-family: monospace; font-size: 14px; }
.px-val { color: $brand-300; font-weight: 500; font-family: monospace; font-size: 14px; }
.use-val { color: $brand-400; font-size: 12px; }
</style>
