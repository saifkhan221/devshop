<template>
  <div class="box-shadow-gen">
    <div class="preview-area">
      <div class="preview-box" :style="{ boxShadow: cssOutput }"></div>
    </div>

    <div class="controls">
      <div class="shadows-header">
        <span class="section-title">Shadow Layers</span>
        <button class="add-shadow-btn" @click="addShadow">+ Add Layer</button>
      </div>

      <div class="shadow-tabs">
        <button
          v-for="(s, i) in shadows"
          :key="i"
          class="shadow-tab"
          :class="{ active: activeShadow === i }"
          @click="activeShadow = i"
        >Layer {{ i + 1 }}</button>
        <button v-if="shadows.length > 1" class="remove-tab" @click="removeShadow(activeShadow)">✕</button>
      </div>

      <div v-if="shadows[activeShadow]" class="shadow-controls">
        <div class="control-row">
          <label>X Offset: {{ shadows[activeShadow].x }}px</label>
          <input type="range" v-model.number="shadows[activeShadow].x" min="-50" max="50" />
        </div>
        <div class="control-row">
          <label>Y Offset: {{ shadows[activeShadow].y }}px</label>
          <input type="range" v-model.number="shadows[activeShadow].y" min="-50" max="50" />
        </div>
        <div class="control-row">
          <label>Blur: {{ shadows[activeShadow].blur }}px</label>
          <input type="range" v-model.number="shadows[activeShadow].blur" min="0" max="100" />
        </div>
        <div class="control-row">
          <label>Spread: {{ shadows[activeShadow].spread }}px</label>
          <input type="range" v-model.number="shadows[activeShadow].spread" min="-50" max="50" />
        </div>
        <div class="control-row">
          <label>Opacity: {{ Math.round(shadows[activeShadow].opacity * 100) }}%</label>
          <input type="range" v-model.number="shadows[activeShadow].opacity" min="0" max="1" step="0.01" />
        </div>
        <div class="control-row color-row">
          <label>Color:</label>
          <input type="color" v-model="shadows[activeShadow].color" class="color-input" />
          <label class="inset-label">
            <input type="checkbox" v-model="shadows[activeShadow].inset" /> Inset
          </label>
        </div>
      </div>

      <div class="css-output">
        <div class="css-label">CSS Output</div>
        <code>box-shadow: {{ cssOutput }};</code>
        <button class="copy-btn" @click="copyCSS">{{ copied ? 'Copied!' : 'Copy CSS' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ projectId: String })

const activeShadow = ref(0)
const copied = ref(false)

const shadows = ref([
  { x: 4, y: 8, blur: 24, spread: 0, color: '#000000', opacity: 0.3, inset: false }
])

function shadowToCSS(s) {
  const hex = s.color
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  const rgba = `rgba(${r},${g},${b},${s.opacity})`
  return `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${rgba}`
}

const cssOutput = computed(() => shadows.value.map(shadowToCSS).join(', '))

function addShadow() {
  shadows.value.push({ x: 2, y: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.2, inset: false })
  activeShadow.value = shadows.value.length - 1
}

function removeShadow(i) {
  shadows.value.splice(i, 1)
  if (activeShadow.value >= shadows.value.length) activeShadow.value = shadows.value.length - 1
}

async function copyCSS() {
  await navigator.clipboard.writeText(`box-shadow: ${cssOutput.value};`)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: $bg-elevated;
  border-radius: $radius-lg;
  margin-bottom: 24px;
}

.preview-box {
  width: 120px; height: 120px;
  background: #fff;
  border-radius: 12px;
  transition: box-shadow 0.2s;
}

.controls { }

.shadows-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; }

.add-shadow-btn {
  padding: 5px 12px;
  background: $brand-700;
  border: none; border-radius: 6px;
  color: $brand-300;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: $brand-600; color: #fff; }
}

.shadow-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.shadow-tab {
  padding: 5px 12px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: $brand-400;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &.active { background: $brand-700; color: #fff; border-color: $brand-600; }
}

.remove-tab {
  padding: 5px 10px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 6px;
  color: #f87171;
  font-size: 12px;
  cursor: pointer;
}

.shadow-controls { margin-bottom: 20px; }

.control-row {
  margin-bottom: 14px;
  label { display: block; font-size: 12px; color: $brand-300; margin-bottom: 6px; }
  input[type="range"] { width: 100%; accent-color: $brand-500; }
  &.color-row { display: flex; align-items: center; gap: 12px; label { margin-bottom: 0; } }
}

.color-input { width: 40px; height: 32px; border: none; border-radius: 6px; cursor: pointer; background: transparent; }

.inset-label {
  display: flex !important;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  input { accent-color: $brand-500; }
}

.css-output {
  background: $bg-elevated;
  border-radius: $radius-md;
  padding: 16px;
  position: relative;
  code { display: block; font-size: 13px; color: $brand-300; font-family: monospace; word-break: break-all; margin: 8px 0; }
}

.css-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }

.copy-btn {
  padding: 6px 14px;
  background: $brand-600;
  border: none; border-radius: 8px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: $brand-500; }
}
</style>
