<template>
  <div class="breakpoint-tester">
    <div class="url-row">
      <input v-model="url" class="url-input" placeholder="https://example.com" @keydown.enter="loadUrl" />
      <button class="load-btn" @click="loadUrl">Load</button>
    </div>

    <div class="presets-row">
      <button
        v-for="p in presets"
        :key="p.name"
        class="preset-btn"
        :class="{ active: currentWidth === p.width }"
        @click="setWidth(p.width)"
      >
        {{ p.icon }} {{ p.name }}
        <span class="preset-px">{{ p.width }}px</span>
      </button>
      <div class="custom-width">
        <input type="number" v-model.number="customWidth" class="width-input" @change="setWidth(customWidth)" placeholder="Custom" />
        <span class="px-label">px</span>
      </div>
    </div>

    <div class="frame-wrapper">
      <div class="frame-label">{{ currentWidth }}px</div>
      <div class="frame-container" :style="{ width: currentWidth + 'px' }">
        <div v-if="!activeUrl" class="frame-placeholder">
          <div class="placeholder-icon">📱</div>
          <p>Enter a URL above and click Load to preview</p>
        </div>
        <div v-else-if="blocked" class="frame-blocked">
          <div class="blocked-icon">🚫</div>
          <p>This site blocks iframe embedding (X-Frame-Options)</p>
          <a :href="activeUrl" target="_blank" class="open-link">Open in new tab ↗</a>
        </div>
        <iframe
          v-else
          ref="iframeRef"
          :src="activeUrl"
          class="preview-frame"
          :style="{ width: currentWidth + 'px', height: '500px' }"
          @error="blocked = true"
          sandbox="allow-scripts allow-same-origin allow-forms"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({ projectId: String })

const url = ref('')
const activeUrl = ref('')
const currentWidth = ref(1280)
const customWidth = ref(1280)
const blocked = ref(false)
const iframeRef = ref(null)

const presets = [
  { name: 'Mobile', icon: '📱', width: 375 },
  { name: 'Tablet', icon: '📲', width: 768 },
  { name: 'Laptop', icon: '💻', width: 1024 },
  { name: 'Desktop', icon: '🖥️', width: 1280 },
  { name: 'Wide', icon: '🖥️', width: 1440 },
]

function setWidth(w) {
  currentWidth.value = w
  customWidth.value = w
}

function loadUrl() {
  if (!url.value) return
  let u = url.value
  if (!u.startsWith('http')) u = 'https://' + u
  blocked.value = false
  activeUrl.value = u
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.url-row { display: flex; gap: 10px; margin-bottom: 16px; }
.url-input { flex: 1; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; padding: 10px 14px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } &::placeholder { color: rgba(167,139,250,0.4); } }
.load-btn { padding: 10px 20px; background: linear-gradient(135deg, $brand-600, $brand-500); border: none; border-radius: $radius-md; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }

.presets-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
.preset-btn { padding: 7px 14px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; color: $brand-300; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 2px; &.active { background: $brand-700; border-color: $brand-600; color: #fff; } &:hover:not(.active) { background: $bg-surface; border-color: $brand-500; } }
.preset-px { font-size: 10px; color: $brand-400; }
.custom-width { display: flex; align-items: center; gap: 4px; }
.width-input { width: 80px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 8px 10px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } }
.px-label { font-size: 12px; color: $brand-400; }

.frame-wrapper { overflow-x: auto; }
.frame-label { font-size: 12px; font-weight: 600; color: $brand-300; text-align: center; margin-bottom: 8px; }
.frame-container { margin: 0 auto; transition: width 0.3s; }

.frame-placeholder, .frame-blocked { height: 500px; background: $bg-elevated; border-radius: $radius-lg; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: $brand-400; font-size: 13px; text-align: center; }
.placeholder-icon, .blocked-icon { font-size: 36px; }
.open-link { color: $brand-300; text-decoration: none; &:hover { color: #fff; } }

.preview-frame { border: none; border-radius: $radius-lg; display: block; }
</style>
