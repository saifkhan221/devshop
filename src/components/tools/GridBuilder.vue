<template>
  <div class="grid-builder">
    <div class="controls-row">
      <div class="control-group">
        <label>Columns</label>
        <input type="number" v-model.number="cols" min="1" max="12" />
      </div>
      <div class="control-group">
        <label>Rows</label>
        <input type="number" v-model.number="rows" min="1" max="6" />
      </div>
      <div class="control-group">
        <label>Column Gap</label>
        <input type="number" v-model.number="colGap" min="0" max="48" />
      </div>
      <div class="control-group">
        <label>Row Gap</label>
        <input type="number" v-model.number="rowGap" min="0" max="48" />
      </div>
    </div>

    <div class="grid-preview" :style="gridStyle">
      <div
        v-for="(_, i) in cells"
        :key="i"
        class="grid-cell"
        :class="{ selected: selectedCells.includes(i) }"
        @click="toggleCell(i)"
      >{{ i + 1 }}</div>
    </div>

    <div class="css-output">
      <div class="css-header">
        <div class="css-label">CSS Output</div>
        <button class="copy-btn" @click="copyCSS">{{ copied ? 'Copied!' : 'Copy CSS' }}</button>
      </div>
      <code>{{ cssCode }}</code>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ projectId: String })

const cols = ref(3)
const rows = ref(3)
const colGap = ref(16)
const rowGap = ref(16)
const selectedCells = ref([])
const copied = ref(false)

const cells = computed(() => Array.from({ length: cols.value * rows.value }))

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
  gridTemplateRows: `repeat(${rows.value}, 80px)`,
  gap: `${rowGap.value}px ${colGap.value}px`,
}))

const cssCode = computed(() => `.grid {\n  display: grid;\n  grid-template-columns: repeat(${cols.value}, 1fr);\n  grid-template-rows: repeat(${rows.value}, 1fr);\n  column-gap: ${colGap.value}px;\n  row-gap: ${rowGap.value}px;\n}`)

function toggleCell(i) {
  const idx = selectedCells.value.indexOf(i)
  if (idx === -1) selectedCells.value.push(i)
  else selectedCells.value.splice(idx, 1)
}

async function copyCSS() {
  await navigator.clipboard.writeText(cssCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.controls-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.control-group { label { display: block; font-size: 11px; font-weight: 600; color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; } input { width: 80px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 7px 10px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } } }

.grid-preview { background: $bg-elevated; border-radius: $radius-lg; padding: 16px; margin-bottom: 20px; min-height: 200px; }

.grid-cell { background: $brand-800; border: 1px solid var(--border-subtle); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: $brand-400; cursor: pointer; transition: all 0.2s; &:hover { border-color: $brand-500; color: $brand-300; } &.selected { background: var(--accent-subtle); border-color: $brand-500; color: $brand-300; } }

.css-output { background: $bg-elevated; border-radius: $radius-md; padding: 16px; }
.css-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.css-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; }
code { display: block; font-size: 12px; color: $brand-300; font-family: monospace; white-space: pre; }
.copy-btn { padding: 6px 14px; background: $brand-600; border: none; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; &:hover { background: $brand-500; } }
</style>
