<template>
  <div class="gradient-gen">
    <div class="preview" :style="{ background: cssGradient }"></div>

    <div class="controls">
      <div class="type-row">
        <button v-for="t in types" :key="t" class="type-btn" :class="{ active: type === t }" @click="type = t">{{ t }}</button>
      </div>

      <div v-if="type === 'Linear'" class="control-row">
        <label>Angle: {{ angle }}°</label>
        <input type="range" v-model.number="angle" min="0" max="360" />
      </div>

      <div class="stops-label">
        <span class="section-title">Color Stops</span>
        <button class="add-stop-btn" @click="addStop">+ Add Stop</button>
      </div>

      <div class="stops">
        <div v-for="(stop, i) in stops" :key="i" class="stop-row">
          <input type="color" v-model="stop.color" class="stop-color" />
          <input type="range" v-model.number="stop.pos" min="0" max="100" class="stop-pos" />
          <span class="stop-pos-val">{{ stop.pos }}%</span>
          <button v-if="stops.length > 2" class="del-stop" @click="stops.splice(i,1)">✕</button>
        </div>
      </div>

      <div class="css-output">
        <div class="css-label">CSS Output</div>
        <code>background: {{ cssGradient }};</code>
        <button class="copy-btn" @click="copyCSS">{{ copied ? 'Copied!' : 'Copy CSS' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ projectId: String })

const type = ref('Linear')
const types = ['Linear', 'Radial', 'Conic']
const angle = ref(135)
const copied = ref(false)

const stops = ref([
  { color: '#4c2c99', pos: 0 },
  { color: '#7c3aed', pos: 100 }
])

const stopsCSS = computed(() => stops.value.map(s => `${s.color} ${s.pos}%`).join(', '))

const cssGradient = computed(() => {
  if (type.value === 'Linear') return `linear-gradient(${angle.value}deg, ${stopsCSS.value})`
  if (type.value === 'Radial') return `radial-gradient(circle, ${stopsCSS.value})`
  return `conic-gradient(from ${angle.value}deg, ${stopsCSS.value})`
})

function addStop() {
  stops.value.push({ color: '#a78bfa', pos: 50 })
}

async function copyCSS() {
  await navigator.clipboard.writeText(`background: ${cssGradient.value};`)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.preview { height: 160px; border-radius: $radius-lg; margin-bottom: 24px; transition: background 0.3s; }

.type-row { display: flex; gap: 8px; margin-bottom: 20px; }
.type-btn { padding: 7px 16px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: 20px; color: $brand-400; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; &.active { background: $brand-700; color: #fff; border-color: $brand-600; } }

.control-row { margin-bottom: 16px; label { display: block; font-size: 12px; color: $brand-300; margin-bottom: 6px; } input[type="range"] { width: 100%; accent-color: $brand-500; } }

.stops-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.section-title { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; }
.add-stop-btn { padding: 5px 12px; background: $brand-700; border: none; border-radius: 6px; color: $brand-300; font-size: 12px; cursor: pointer; &:hover { background: $brand-600; color: #fff; } }

.stops { margin-bottom: 20px; }
.stop-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.stop-color { width: 36px; height: 32px; border: none; border-radius: 6px; cursor: pointer; background: transparent; padding: 0; }
.stop-pos { flex: 1; accent-color: $brand-500; }
.stop-pos-val { font-size: 12px; color: $brand-400; min-width: 32px; }
.del-stop { background: transparent; border: none; color: $brand-400; cursor: pointer; font-size: 11px; &:hover { color: #f87171; } }

.css-output { background: $bg-elevated; border-radius: $radius-md; padding: 16px; }
.css-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
code { display: block; font-size: 12px; color: $brand-300; font-family: monospace; word-break: break-all; margin-bottom: 10px; }
.copy-btn { padding: 6px 14px; background: $brand-600; border: none; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; &:hover { background: $brand-500; } }
</style>
