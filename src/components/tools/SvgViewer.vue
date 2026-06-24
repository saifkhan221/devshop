<template>
  <div class="svg-viewer">
    <div
      class="upload-zone"
      :class="{ dragging }"
      @click="fileInput.click()"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="handleDrop"
    >
      <div v-if="!svgContent">
        <div class="upload-icon">🖼️</div>
        <p class="upload-text">Drop SVG file here or click to browse</p>
        <p class="upload-sub">Supports .svg files</p>
      </div>
      <div v-else class="svg-preview" v-html="svgContent"></div>
    </div>

    <input ref="fileInput" type="file" accept=".svg" style="display:none" @change="handleFile" />

    <div v-if="svgContent" class="svg-meta">
      <div class="meta-item"><span class="meta-label">Width:</span> <span class="meta-val">{{ svgWidth || 'auto' }}</span></div>
      <div class="meta-item"><span class="meta-label">Height:</span> <span class="meta-val">{{ svgHeight || 'auto' }}</span></div>
      <div class="meta-item"><span class="meta-label">ViewBox:</span> <span class="meta-val">{{ svgViewBox || 'none' }}</span></div>
      <div class="meta-item"><span class="meta-label">Size:</span> <span class="meta-val">{{ fileSize }}</span></div>
    </div>

    <div v-if="svgContent" class="code-section">
      <div class="code-header">
        <span class="section-title">SVG Source</span>
        <div style="display:flex;gap:8px;">
          <button class="copy-btn" @click="copyCode">{{ copied ? 'Copied!' : 'Copy Code' }}</button>
          <button class="copy-btn" @click="download">Download</button>
        </div>
      </div>
      <pre class="code-block">{{ svgContent }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DOMPurify from 'dompurify'

defineProps({ projectId: String })

// Sanitize SVG: strips <script>, event handlers, foreign objects, etc.
function sanitizeSvg(raw) {
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'xlink:href']
  })
}

const fileInput = ref(null)
const svgContent = ref('')
const svgWidth = ref('')
const svgHeight = ref('')
const svgViewBox = ref('')
const fileSize = ref('')
const dragging = ref(false)
const copied = ref(false)
const fileName = ref('file.svg')

function handleDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) readFile(file)
}

function handleFile(e) {
  const file = e.target.files[0]
  if (file) readFile(file)
}

function readFile(file) {
  fileName.value = file.name
  fileSize.value = `${(file.size / 1024).toFixed(1)} KB`
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = sanitizeSvg(e.target.result)
    svgContent.value = content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'image/svg+xml')
    const svg = doc.querySelector('svg')
    if (svg) {
      svgWidth.value = svg.getAttribute('width') || ''
      svgHeight.value = svg.getAttribute('height') || ''
      svgViewBox.value = svg.getAttribute('viewBox') || ''
    }
  }
  reader.readAsText(file)
}

async function copyCode() {
  await navigator.clipboard.writeText(svgContent.value)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

function download() {
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.upload-zone {
  border: 2px dashed var(--accent-glow);
  border-radius: $radius-lg;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover, &.dragging { border-color: $brand-500; background: var(--accent-subtle); }
}

.upload-icon { font-size: 36px; margin-bottom: 12px; }
.upload-text { font-size: 14px; color: $brand-300; margin-bottom: 6px; }
.upload-sub { font-size: 12px; color: $brand-400; }

.svg-preview :deep(svg) { max-width: 200px; max-height: 200px; }

.svg-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: $bg-elevated;
  border-radius: $radius-md;
}

.meta-item { font-size: 13px; }
.meta-label { color: $brand-400; margin-right: 4px; }
.meta-val { color: #fff; font-family: monospace; }

.code-section { }
.code-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.section-title { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; }
.code-block { background: $bg-elevated; border-radius: $radius-md; padding: 16px; font-size: 12px; color: $brand-300; font-family: monospace; overflow-x: auto; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
.copy-btn { padding: 6px 14px; background: $brand-600; border: none; border-radius: 8px; color: #fff; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background: $brand-500; } }
</style>
