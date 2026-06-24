<template>
  <div class="font-pairing">
    <div class="controls-row">
      <div class="control-group">
        <label>Heading Font</label>
        <select v-model="headingFont" @change="loadFonts">
          <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
      <div class="control-group">
        <label>Body Font</label>
        <select v-model="bodyFont" @change="loadFonts">
          <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
      <div class="control-group">
        <label>Heading Size: {{ headingSize }}px</label>
        <input type="range" v-model.number="headingSize" min="20" max="60" />
      </div>
      <div class="control-group">
        <label>Body Size: {{ bodySize }}px</label>
        <input type="range" v-model.number="bodySize" min="12" max="24" />
      </div>
    </div>

    <div class="preview-card" :style="{ fontFamily: bodyFont }">
      <h2 :style="{ fontFamily: headingFont, fontSize: headingSize + 'px' }">
        The Quick Brown Fox Jumps Over the Lazy Dog
      </h2>
      <p :style="{ fontSize: bodySize + 'px' }">
        Typography is the art and technique of arranging type to make written language legible, readable, and appealing. Good font pairing creates visual hierarchy and improves user experience.
      </p>
      <p :style="{ fontSize: bodySize + 'px', opacity: 0.7 }">
        123456789 &amp; #@!$%
      </p>
    </div>

    <div class="css-output">
      <div class="css-label">CSS @import</div>
      <code>{{ importCode }}</code>
      <button class="copy-btn" @click="copyCSS">{{ copied ? 'Copied!' : 'Copy' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

defineProps({ projectId: String })

const fonts = [
  'Inter', 'Playfair Display', 'Montserrat', 'Raleway', 'Lora', 'Oswald',
  'Merriweather', 'Nunito', 'Poppins', 'Roboto Slab', 'Source Sans 3', 'Open Sans', 'Libre Baskerville'
]

const headingFont = ref('Playfair Display')
const bodyFont = ref('Inter')
const headingSize = ref(36)
const bodySize = ref(16)
const copied = ref(false)

function loadFonts() {
  const encode = f => f.replace(/ /g, '+')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encode(headingFont.value)}:wght@400;700&family=${encode(bodyFont.value)}:wght@400;500&display=swap`
  document.head.appendChild(link)
}

onMounted(loadFonts)

const importCode = computed(() => {
  const encode = f => f.replace(/ /g, '+')
  return `@import url('https://fonts.googleapis.com/css2?family=${encode(headingFont.value)}:wght@400;700&family=${encode(bodyFont.value)}:wght@400;500&display=swap');\n\nh1, h2, h3 { font-family: '${headingFont.value}', serif; }\nbody { font-family: '${bodyFont.value}', sans-serif; }`
})

async function copyCSS() {
  await navigator.clipboard.writeText(importCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.controls-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.control-group { label { display: block; font-size: 11px; font-weight: 600; color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; } select, input[type="range"] { width: 100%; } select { background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 8px 10px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } } input[type="range"] { accent-color: $brand-500; margin-top: 6px; } }

.preview-card { background: $bg-elevated; border-radius: $radius-lg; padding: 28px; margin-bottom: 20px; h2 { color: #fff; font-weight: 700; margin-bottom: 16px; line-height: 1.2; } p { color: $brand-300; line-height: 1.7; margin-bottom: 8px; } }

.css-output { background: $bg-elevated; border-radius: $radius-md; padding: 16px; }
.css-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
code { display: block; font-size: 12px; color: $brand-300; font-family: monospace; white-space: pre; margin-bottom: 12px; }
.copy-btn { padding: 6px 14px; background: $brand-600; border: none; border-radius: 8px; color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; &:hover { background: $brand-500; } }
</style>
