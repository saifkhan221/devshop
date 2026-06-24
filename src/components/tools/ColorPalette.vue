<template>
  <div class="color-palette">
    <div class="input-row">
      <input type="color" v-model="baseColor" class="color-picker" />
      <input type="text" v-model="baseColor" class="hex-input" placeholder="#7c3aed" />
      <button class="gen-btn" @click="generatePalette">Generate Palette</button>
    </div>

    <div v-if="palette.length > 0" class="palette-section">
      <div class="section-title">Generated Palette</div>
      <div class="swatches">
        <div
          v-for="swatch in palette"
          :key="swatch.shade"
          class="swatch"
          :style="{ background: swatch.hex }"
          @click="copyColor(swatch.hex)"
          :title="swatch.hex"
        >
          <span class="swatch-shade">{{ swatch.shade }}</span>
          <span class="swatch-hex">{{ swatch.hex }}</span>
        </div>
      </div>
      <button class="save-btn" @click="savePalette">Save Palette</button>
    </div>

    <div v-if="savedPalettes.length > 0" class="saved-section">
      <div class="section-title">Saved Palettes</div>
      <div v-for="(pal, idx) in savedPalettes" :key="idx" class="saved-palette">
        <div class="saved-swatches">
          <div v-for="s in pal.slice(0,10)" :key="s.shade" class="saved-swatch" :style="{ background: s.hex }"></div>
        </div>
        <button class="del-btn" @click="savedPalettes.splice(idx, 1); persist(savedPalettes)">✕</button>
      </div>
    </div>

    <div v-if="copiedColor" class="toast-msg">Copied {{ copiedColor }}!</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const { data: savedPalettes, save: persist } = useToolStorage(props.projectId, 'color-palette', [])

const baseColor = ref('#7c3aed')
const palette = ref([])
const copiedColor = ref('')

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b)
  let h, s, l = (max+min)/2
  if (max === min) { h = s = 0 }
  else {
    const d = max-min
    s = l > 0.5 ? d/(2-max-min) : d/(max+min)
    switch(max) {
      case r: h = (g-b)/d + (g<b?6:0); break
      case g: h = (b-r)/d + 2; break
      case b: h = (r-g)/d + 4; break
    }
    h /= 6
  }
  return [h*360, s*100, l*100]
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p, q, t) => { if (t<0) t+=1; if (t>1) t-=1; if (t<1/6) return p+(q-p)*6*t; if (t<1/2) return q; if (t<2/3) return p+(q-p)*(2/3-t)*6; return p }
    const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q
    r = hue2rgb(p,q,h+1/3); g = hue2rgb(p,q,h); b = hue2rgb(p,q,h-1/3)
  }
  return '#' + [r,g,b].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('')
}

function generatePalette() {
  const [h, s] = hexToHsl(baseColor.value)
  const shades = [50,100,200,300,400,500,600,700,800,900,950]
  const lightnesses = [97,93,87,78,67,53,40,30,21,13,8]
  palette.value = shades.map((shade, i) => ({
    shade,
    hex: hslToHex(h, Math.min(s, 90), lightnesses[i])
  }))
}

function copyColor(hex) {
  navigator.clipboard.writeText(hex)
  copiedColor.value = hex
  setTimeout(() => copiedColor.value = '', 1500)
}

function savePalette() {
  if (savedPalettes.value.length >= 5) savedPalettes.value.shift()
  savedPalettes.value.push([...palette.value])
  persist(savedPalettes.value)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.input-row { display: flex; gap: 10px; margin-bottom: 24px; align-items: center; }

.color-picker { width: 48px; height: 40px; border: none; border-radius: $radius-sm; cursor: pointer; background: transparent; padding: 0; }

.hex-input {
  flex: 1;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: 10px 14px;
  font-family: monospace;
  font-size: 14px;
  color: #fff;
  outline: none;
  &:focus { border-color: $brand-500; }
}

.gen-btn { padding: 10px 18px; background: linear-gradient(135deg, $brand-600, $brand-500); border: none; border-radius: $radius-md; color: #fff; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; &:hover { transform: translateY(-1px); } }

.section-title { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }

.swatches { display: flex; border-radius: $radius-md; overflow: hidden; margin-bottom: 16px; }

.swatch {
  flex: 1;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 6px;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: scaleY(1.05); }
}

.swatch-shade { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.7); }
.swatch-hex { font-size: 8px; color: rgba(255,255,255,0.5); font-family: monospace; }

.save-btn { padding: 8px 16px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; color: $brand-300; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background: $brand-700; color: #fff; } }

.saved-section { margin-top: 24px; }

.saved-palette { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; background: $bg-elevated; border-radius: $radius-md; padding: 10px; }

.saved-swatches { display: flex; gap: 4px; flex: 1; }

.saved-swatch { flex: 1; height: 28px; border-radius: 4px; }

.del-btn { background: transparent; border: none; color: $brand-400; cursor: pointer; font-size: 12px; &:hover { color: #f87171; } }

.toast-msg { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: $brand-700; color: #fff; padding: 8px 16px; border-radius: $radius-md; font-size: 13px; }
</style>
