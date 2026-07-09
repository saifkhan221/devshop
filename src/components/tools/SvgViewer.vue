<template>
  <div class="sv-root">

    <!-- ── Top toolbar ──────────────────────────────────────────────── -->
    <div class="sv-toolbar">
      <div class="sv-toolbar-left">
        <span class="sv-logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          SVG Viewer
        </span>
      </div>
      <div class="sv-toolbar-right">
        <button class="sv-tbtn" @click="fileInput.click()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload file
        </button>
        <button class="sv-tbtn" @click="showIconLib = !showIconLib">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Icons
        </button>
      </div>
    </div>

    <!-- ── Main workspace ───────────────────────────────────────────── -->
    <div class="sv-workspace">

      <!-- ── Left: Code panel ──────────────────────────────────────── -->
      <div
        class="sv-pane sv-pane--code"
        :class="{ 'is-dragging': dragging }"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent
        @dragleave="onDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="sv-pane-tabs">
          <button class="sv-tab" :class="{ active: activeTab === 'code' }" @click="activeTab = 'code'">Code</button>
          <button class="sv-tab" @click="pasteFromClipboard">Paste</button>
          <button class="sv-tab" @click="copyCode">{{ copied ? 'Copied!' : 'Copy' }}</button>
        </div>
        <div v-if="activeTab === 'code'" class="sv-editor-wrap">
          <pre class="sv-highlight" aria-hidden="true" v-html="highlightedCode"></pre>
          <textarea
            class="sv-code-editor"
            v-model="rawCode"
            spellcheck="false"
            placeholder="<svg ...>"
            @input="onCodeInput"
            @scroll="syncScroll"
            ref="editorRef"
          ></textarea>
        </div>
      </div>

      <!-- ── Right: Preview panel ──────────────────────────────────── -->
      <div class="sv-pane sv-pane--preview">
        <div class="sv-pane-tabs">
          <button class="sv-tab active">Preview</button>
          <div class="sv-theme-group">
            <button class="sv-theme-btn" :class="{ active: previewBg === 'light' }" @click="previewBg = 'light'">Light</button>
            <button class="sv-theme-btn" :class="{ active: previewBg === 'dark' }"  @click="previewBg = 'dark'">Dark</button>
            <button class="sv-theme-btn" :class="{ active: previewBg === 'checker' }" @click="previewBg = 'checker'">BG</button>
          </div>
        </div>

        <!-- Drop zone / preview area -->
        <div
          class="sv-preview-area"
          :class="[`bg-${previewBg}`]"
          @click="!svgContent && fileInput.click()"
        >
          <div v-if="!svgContent" class="sv-drop-hint">
            <svg class="sv-drop-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p class="sv-drop-title">Drag your SVG here</p>
            <p class="sv-drop-sub">or click to browse · or paste code on the left</p>
          </div>
          <div
            v-else
            class="sv-svg-wrap"
            :style="{ transform: `scale(${zoom / 100})` }"
            v-html="sanitizedSvg"
          ></div>
        </div>
      </div>

    </div>

    <!-- ── Status bar ───────────────────────────────────────────────── -->
    <div class="sv-statusbar">
      <div class="sv-status-left">
        <span v-if="svgContent" class="sv-stat">
          <span class="sv-stat-dim">{{ svgWidth || '?' }}×{{ svgHeight || '?' }}</span>
        </span>
        <span v-if="pathCount > 0" class="sv-stat sv-stat-badge">{{ pathCount }} {{ pathCount === 1 ? 'path' : 'paths' }}</span>
        <span v-if="fillColor" class="sv-stat sv-stat-fill">
          <span class="sv-fill-dot" :style="{ background: fillColor }"></span>
          {{ fillColor }}
        </span>
        <span v-if="fileSize" class="sv-stat sv-stat-muted">{{ fileSize }}</span>
      </div>
      <div class="sv-status-right">
        <div class="sv-zoom-group">
          <button class="sv-zoom-btn" @click="zoomOut">−</button>
          <input
            class="sv-zoom-val"
            :value="zoom"
            @change="setZoom($event.target.value)"
            @keydown.enter="$event.target.blur()"
            type="number"
            min="10"
            max="800"
          />
          <span class="sv-zoom-pct">%</span>
          <button class="sv-zoom-btn" @click="zoomIn">+</button>
        </div>
        <button class="sv-export-btn" @click="exportSvg" :disabled="!svgContent">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </div>
    </div>

    <!-- ── Icons Library panel ──────────────────────────────────────── -->
    <transition name="panel-slide">
      <div v-if="showIconLib" class="sv-icon-lib" ref="iconLibRef">
        <div class="sv-il-header">
          <span class="sv-il-title">Icon Library</span>
          <input v-model="iconSearch" class="sv-il-search" placeholder="Search icons…" />
          <button class="sv-il-close" @click="showIconLib = false">✕</button>
        </div>
        <div class="sv-il-grid">
          <button
            v-for="icon in filteredIcons"
            :key="icon.name"
            class="sv-il-item"
            :title="icon.name"
            @click="loadIcon(icon)"
          >
            <span class="sv-il-svg" v-html="icon.svg"></span>
            <span class="sv-il-name">{{ icon.name }}</span>
          </button>
        </div>
      </div>
    </transition>

    <input ref="fileInput" type="file" accept=".svg" style="display:none" @change="handleFile" />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import DOMPurify from 'dompurify'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const { data, save } = useToolStorage(props.projectId, 'svg-viewer', {
  rawCode: '',
  previewBg: 'checker',
  zoom: 100,
})

// ─── State ────────────────────────────────────────────────────────────────
const fileInput   = ref(null)
const rawCode     = computed({ get: () => data.value.rawCode,   set: v => { data.value.rawCode = v;   save() } })
const previewBg   = computed({ get: () => data.value.previewBg, set: v => { data.value.previewBg = v; save() } })
const zoom        = computed({ get: () => data.value.zoom,      set: v => { data.value.zoom = v;      save() } })
const svgContent  = ref('')
const svgWidth    = ref('')
const svgHeight   = ref('')
const fileSize    = ref('')
const pathCount   = ref(0)
const fillColor   = ref('')
const dragging    = ref(false)
const copied      = ref(false)
const activeTab   = ref('code')
const showIconLib = ref(false)
const iconSearch  = ref('')
const iconLibRef  = ref(null)
const editorRef   = ref(null)
const fileName    = ref('icon.svg')

// ─── Default SVG ──────────────────────────────────────────────────────────
const DEFAULT_SVG = `<svg width="800px" height="800px" viewBox="0 -15.5 1055 1055" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <path d="M573.213047 261.967704s125.388395 185.46511 206.373624 190.700075c0 0 23.510324-133.22517 2.617483-193.301884-0.015674-0.015674-99.276262-28.74529-208.991107 2.601809zM264.961352 460.504554l86.204521 23.510324 52.23994-91.423814c0.015674-0.015674-135.826979 47.004975-138.444461 67.91349zM562.75879 679.934245l15.673549 86.204521 23.510324-20.908515 39.183873-70.530972 2.617483-47.020648zM406.023296 538.8723l-86.204521 33.964582 13.056066 23.510324-39.183873 104.495553 5.219292 18.291032 20.892841-7.836774 62.694197 15.673549s57.474905 15.673549 83.587039-10.454257l33.964582-41.801356 5.219292-28.729616-99.244915-107.113037z" fill="#C0EAFF"/>
  <path d="M558.840402 472.259716m-82.286134 0a82.286134 82.286134 0 1 0 164.572268 0 82.286134 82.286134 0 1 0-164.572268 0Z" fill="#C0EAFF"/>
  <path d="M553.480048 698.961933a15.673549 15.673549 0 0 1-11.081199-4.592349L343.093995 495.049056a15.673549 15.673549 0 0 1-3.322792-17.256577c32.444247-75.703243 140.403655-181.734805 211.624263-222.439013 21.378721-12.209695 51.26818-19.999449 88.837678-23.165506a15.689223 15.689223 0 0 1 2.633156 31.253058c-32.992821 2.774218-58.540707 9.216047-75.922673 19.137403-62.223991 35.563283-160.058286 131.030873-193.928826 198.082317l183.772366 183.78804c67.051444-33.886214 162.534707-131.720509 198.082317-193.9445 30.720157-53.775948 19.372507-166.970321 14.811504-202.768708a736.609799 736.609799 0 0 0-64.12049-5.376027 15.673549 15.673549 0 0 1-15.046608-16.269145 15.375752 15.375752 0 0 1 16.269145-15.046607c36.284267 1.410619 66.111031 5.407375 76.063735 6.865015a14.184562 14.184562 0 0 1 5.172271 0.689636c3.13471 1.003107 5.877581 2.86826 7.852448 5.329007a15.124975 15.124975 0 0 1 2.946627 5.313333c0.595595 1.880826 0.846372 3.824346 0.752331 5.736519 3.84002 26.284542 21.378721 163.020587-17.507355 231.059464-40.704208 71.220608-146.735769 179.19569-222.439012 211.639937a15.266037 15.266037 0 0 1-6.144032 1.285231z" fill="#1F87DD"/>
  <path d="M354.190868 499.641406a15.673549 15.673549 0 0 1-3.683284-0.438859l-89.99752-21.660845a15.673549 15.673549 0 0 1-7.962163-25.751642c67.317894-74.402339 153.36568-73.383558 156.954923-73.493273a15.673549 15.673549 0 0 1 15.344405 16.002694 15.783264 15.783264 0 0 1-15.94 15.344405c-0.799351-0.015674-59.700549-0.329145-113.241394 44.121041l62.17697 14.96824a15.657876 15.657876 0 0 1-3.651937 30.908239zM579.168996 792.987556a15.642202 15.642202 0 0 1-15.23469-12.005939l-21.660845-89.99752a15.673549 15.673549 0 1 1 30.46938-7.335221l14.968239 62.17697c44.387492-53.462477 44.136715-112.583105 44.121042-113.241394a15.673549 15.673549 0 0 1 15.407099-15.908653h0.282123a15.673549 15.673549 0 0 1 15.67355 15.328732c0.062694 3.62059 0.956087 89.590008-73.493273 156.954923a15.845958 15.845958 0 0 1-10.532625 4.028102zM770.825157 481.303354a15.673549 15.673549 0 0 1-8.495063-2.507768c-133.287864-86.047786-198.975709-197.267292-201.718581-201.969357a15.689223 15.689223 0 0 1 27.083894-15.783264c0.642616 1.081475 64.951189 109.620804 191.640488 191.405384a15.689223 15.689223 0 0 1-8.510738 28.855005zM559.169547 574.451257a100.201001 100.201001 0 0 1-71.079547-29.387905 100.63986 100.63986 0 0 1 0-142.174766 15.657876 15.657876 0 1 1 22.162399 22.162399 69.277088 69.277088 0 0 0 0 97.849969 69.261415 69.261415 0 0 0 97.834295 0 69.277088 69.277088 0 0 0 0-97.849969 69.230068 69.230068 0 0 0-42.83581-19.999449 15.673549 15.673549 0 0 1 2.727198-31.22171 100.624187 100.624187 0 0 1 62.271011 29.05876 100.63986 100.63986 0 0 1 0 142.174766 100.201001 100.201001 0 0 1-71.079546 29.387905z" fill="#1F87DD"/>
  <path d="M459.611161 738.725728a15.673549 15.673549 0 0 1-7.382241-29.49762c20.077817-10.720708 33.933234-32.914454 41.174414-65.969969a15.673549 15.673549 0 0 1 30.626115 6.708279c-9.310088 42.443972-28.494513 71.690815-57.05172 86.925505a15.595182 15.595182 0 0 1-7.366568 1.833805zM384.503513 744.070409a15.595182 15.595182 0 0 1-3.871367-0.485881c-18.291032-4.655044-31.002281-11.049852-31.535181-11.316302a16.457227 16.457227 0 0 1-2.194297-1.347925c-9.059312-6.645585-32.162123 1.959194-44.904719 9.858662a15.673549 15.673549 0 1 1-23.949183-13.588967c1.253884-68.900923 22.930403-110.420155 38.886076-131.783203a71.283302 71.283302 0 0 1-11.128221-10.140787 15.673549 15.673549 0 0 1 0.454533-21.143618c44.136715-46.221297 102.222889-34.434788 104.667963-33.91756 8.463717 1.818132 13.855418 10.140786 12.052959 18.620176a15.736244 15.736244 0 0 1-18.526135 12.068633c-1.520334-0.313471-32.63233-6.26942-61.518681 13.056067l0.391839 0.015673a15.673549 15.673549 0 0 1 9.560865 28.102674c-1.441967 1.159843-34.199685 28.243736-41.926745 100.138307 16.128082-5.485742 36.832841-8.526411 53.196027 2.539115 2.774218 1.300905 11.958918 5.360354 24.215633 8.47939a15.673549 15.673549 0 0 1 11.331977 19.059036 15.736244 15.736244 0 0 1-15.203343 11.78651z" fill="#1F87DD"/>
  <path d="M360.303553 683.836958a15.689223 15.689223 0 0 1-13.02472-24.372369c3.260098-4.890147 8.040531-10.203481 13.839744-15.407099a15.657876 15.657876 0 1 1 20.939862 23.322242c-5.140924 4.608024-7.664366 7.915142-8.69882 9.482497a15.673549 15.673549 0 0 1-13.056066 6.974729zM409.612539 648.806576a15.673549 15.673549 0 0 1-4.513982-30.68881c9.999724-3.009321 19.043362-3.463854 26.84879-1.332252 2.366706-1.598702 9.090659-14.560727 11.958918-25.579232a15.673549 15.673549 0 0 1 30.328318 7.915142c-1.473314 5.642478-9.748948 34.35642-27.867571 44.842025a29.168475 29.168475 0 0 1-22.663952 3.072015c-0.70531-0.203756-3.542222-0.70531-9.576539 1.112822a15.971347 15.971347 0 0 1-4.513982 0.65829z" fill="#1F87DD"/>
</svg>`

// ─── Sanitize ─────────────────────────────────────────────────────────────
function sanitizeSvg(raw) {
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject', 'iframe'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
  })
}

const sanitizedSvg = computed(() => svgContent.value ? sanitizeSvg(svgContent.value) : '')

// ─── Syntax highlighter ───────────────────────────────────────────────────
function escape(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

const highlightedCode = computed(() => {
  if (!rawCode.value) return ''
  let code = rawCode.value

  // We'll build token-by-token using a regex
  const out = []
  // Matches in order: comment, opening/closing tag, attribute name, attribute value (quoted), plain text
  const re = /(<!--[\s\S]*?-->)|(<\/?([\w:-]+)(?=[>\s/]))|(\/>|>)|(\s[\w:-]+=?)|(\"[^\"]*\")|([^<>"=\s]+)/g
  let inTag = false
  let m

  re.lastIndex = 0
  const raw = code

  let last = 0
  while ((m = re.exec(raw)) !== null) {
    // Add any gap as plain
    if (m.index > last) {
      out.push(`<span class="hl-plain">${escape(raw.slice(last, m.index))}</span>`)
    }
    last = m.index + m[0].length

    if (m[1]) {
      // Comment
      out.push(`<span class="hl-comment">${escape(m[1])}</span>`)
    } else if (m[2]) {
      // Tag open/close  e.g. <svg  </svg
      inTag = true
      const slash = m[2].startsWith('</') ? '<span class="hl-punct">&lt;/</span>' : '<span class="hl-punct">&lt;</span>'
      out.push(`${slash}<span class="hl-tag">${escape(m[3])}</span>`)
    } else if (m[4]) {
      // /> or >
      inTag = false
      out.push(`<span class="hl-punct">${escape(m[4])}</span>`)
    } else if (m[5]) {
      // attribute name (leading space preserved)
      const leading = m[5].match(/^(\s+)/)?.[1] || ''
      const attr = m[5].slice(leading.length)
      out.push(`${escape(leading)}<span class="hl-attr">${escape(attr)}</span>`)
    } else if (m[6]) {
      // quoted value — detect hex color inside
      const inner = m[6].slice(1, -1) // strip quotes
      const hexRe = /#([0-9a-fA-F]{3,8})\b/g
      let hm, hLast = 0, parts = []
      while ((hm = hexRe.exec(inner)) !== null) {
        if (hm.index > hLast) parts.push(`<span class="hl-str">${escape(inner.slice(hLast, hm.index))}</span>`)
        parts.push(`<span class="hl-hex" style="--hc:${hm[0]}">${escape(hm[0])}</span>`)
        hLast = hm.index + hm[0].length
      }
      if (hLast < inner.length) parts.push(`<span class="hl-str">${escape(inner.slice(hLast))}</span>`)
      out.push(`<span class="hl-quot">&quot;</span>${parts.join('')}<span class="hl-quot">&quot;</span>`)
    } else if (m[7]) {
      out.push(`<span class="hl-plain">${escape(m[7])}</span>`)
    }
  }
  if (last < raw.length) out.push(`<span class="hl-plain">${escape(raw.slice(last))}</span>`)

  return out.join('') + '\n' // trailing newline keeps heights in sync
})

// Sync scroll between textarea and highlight pre
function syncScroll(e) {
  const pre = e.target.previousElementSibling
  if (pre) { pre.scrollTop = e.target.scrollTop; pre.scrollLeft = e.target.scrollLeft }
}

// ─── Parse SVG meta ───────────────────────────────────────────────────────
function parseMeta(content) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return
  svgWidth.value  = svg.getAttribute('width')  || ''
  svgHeight.value = svg.getAttribute('height') || ''
  // path count
  pathCount.value = doc.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon').length
  // first fill found
  const filled = doc.querySelector('[fill]:not([fill="none"]):not([fill="currentColor"])')
  fillColor.value = filled ? filled.getAttribute('fill') : ''
}

// ─── Drag & drop ──────────────────────────────────────────────────────────
// Use a counter so dragleave from child elements doesn't falsely reset state
let dragDepth = 0

function onDragEnter() {
  dragDepth++
  dragging.value = true
}

function onDragLeave() {
  dragDepth--
  if (dragDepth <= 0) { dragDepth = 0; dragging.value = false }
}

function handleDrop(e) {
  dragDepth = 0
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (!file) return
  // Accept by MIME type OR extension (some OSes don't set the MIME correctly)
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  if (isSvg) readFile(file)
}

function handleFile(e) {
  const file = e.target.files[0]
  if (file) readFile(file)
}

function readFile(file) {
  fileName.value = file.name
  const bytes = file.size
  fileSize.value = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(0)} KB`
  const reader = new FileReader()
  reader.onload = (ev) => {
    const raw = ev.target.result
    rawCode.value = raw
    svgContent.value = raw
    parseMeta(raw)
  }
  reader.readAsText(file)
}

// ─── Code editor → live preview ──────────────────────────────────────────
function onCodeInput() {
  const val = rawCode.value.trim()
  if (val.startsWith('<svg') || val.includes('<svg ')) {
    svgContent.value = val
    parseMeta(val)
    const bytes = new Blob([val]).size
    fileSize.value = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(0)} KB`
  } else if (!val) {
    svgContent.value = ''
  }
}

// ─── Toolbar actions ──────────────────────────────────────────────────────
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    rawCode.value = text
    onCodeInput()
  } catch { /* clipboard denied */ }
}

async function copyCode() {
  if (!rawCode.value) return
  await navigator.clipboard.writeText(rawCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

function exportSvg() {
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName.value; a.click()
  URL.revokeObjectURL(url)
}

// ─── Zoom ─────────────────────────────────────────────────────────────────
function zoomIn()  { zoom.value = Math.min(zoom.value + 25, 800) }
function zoomOut() { zoom.value = Math.max(zoom.value - 25, 10) }
function setZoom(v) {
  const n = parseInt(v, 10)
  if (!isNaN(n)) zoom.value = Math.min(Math.max(n, 10), 800)
}

// ─── Load icon from library ───────────────────────────────────────────────
function loadIcon(icon) {
  const wrapped = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n${icon.rawPaths}\n</svg>`
  rawCode.value = wrapped
  svgContent.value = wrapped
  svgWidth.value = '24'
  svgHeight.value = '24'
  pathCount.value = 1
  fillColor.value = ''
  fileSize.value = `${new Blob([wrapped]).size} B`
  showIconLib.value = false
}

// ─── Outside click: close icon lib ───────────────────────────────────────
function onOutside(e) {
  if (iconLibRef.value && !iconLibRef.value.contains(e.target)) {
    if (!e.target.closest('.sv-tbtn--accent')) showIconLib.value = false
  }
}
onMounted(() => {
  document.addEventListener('mousedown', onOutside)
  // Use saved SVG if available, otherwise load default
  const code = rawCode.value || DEFAULT_SVG
  if (!rawCode.value) rawCode.value = DEFAULT_SVG
  svgContent.value = code
  parseMeta(code)
  fileSize.value = `${new Blob([code]).size} B`
})
onUnmounted(() => document.removeEventListener('mousedown', onOutside))

// ─── Icons library data ───────────────────────────────────────────────────
const ICONS = [
  { name: 'Arrow Right',   rawPaths: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>' },
  { name: 'Arrow Left',    rawPaths: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>' },
  { name: 'Arrow Up',      rawPaths: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>' },
  { name: 'Arrow Down',    rawPaths: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>' },
  { name: 'Hamburger',     rawPaths: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' },
  { name: 'Close',         rawPaths: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' },
  { name: 'Search',        rawPaths: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' },
  { name: 'Home',          rawPaths: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { name: 'User',          rawPaths: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { name: 'Settings',      rawPaths: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
  { name: 'Plus',          rawPaths: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'Minus',         rawPaths: '<line x1="5" y1="12" x2="19" y2="12"/>' },
  { name: 'Check',         rawPaths: '<polyline points="20 6 9 17 4 12"/>' },
  { name: 'Heart',         rawPaths: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' },
  { name: 'Star',          rawPaths: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
  { name: 'Bell',          rawPaths: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>' },
  { name: 'Mail',          rawPaths: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>' },
  { name: 'Download',      rawPaths: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>' },
  { name: 'Upload',        rawPaths: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>' },
  { name: 'Trash',         rawPaths: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>' },
  { name: 'Edit',          rawPaths: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
  { name: 'Eye',           rawPaths: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' },
  { name: 'Link',          rawPaths: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
  { name: 'Calendar',      rawPaths: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
  { name: 'Clock',         rawPaths: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { name: 'Filter',        rawPaths: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>' },
  { name: 'Grid',          rawPaths: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>' },
  { name: 'List',          rawPaths: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>' },
  { name: 'Share',         rawPaths: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' },
  { name: 'Lock',          rawPaths: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' },
  { name: 'Unlock',        rawPaths: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>' },
  { name: 'Image',         rawPaths: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>' },
  { name: 'Code',          rawPaths: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  { name: 'Terminal',      rawPaths: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>' },
  { name: 'Layers',        rawPaths: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>' },
  { name: 'Chevron Right', rawPaths: '<polyline points="9 18 15 12 9 6"/>' },
  { name: 'Chevron Left',  rawPaths: '<polyline points="15 18 9 12 15 6"/>' },
  { name: 'Chevron Up',    rawPaths: '<polyline points="18 15 12 9 6 15"/>' },
  { name: 'Chevron Down',  rawPaths: '<polyline points="6 9 12 15 18 9"/>' },
  { name: 'Refresh',       rawPaths: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>' },
  { name: 'Zap',           rawPaths: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  { name: 'Globe',         rawPaths: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' },
  { name: 'Mic',           rawPaths: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>' },
  { name: 'Volume',        rawPaths: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>' },
  { name: 'Wifi',          rawPaths: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>' },
]

// Build full svg strings for display
const iconsWithSvg = ICONS.map(icon => ({
  ...icon,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.rawPaths}</svg>`
}))

const filteredIcons = computed(() => {
  const q = iconSearch.value.toLowerCase().trim()
  if (!q) return iconsWithSvg
  return iconsWithSvg.filter(i => i.name.toLowerCase().includes(q))
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

// ── Root ───────────────────────────────────────────────────────────────────
.sv-root {
  display: flex;
  flex-direction: column;
  height: 560px;
  overflow: hidden;
  position: relative;
  font-family: 'Inter', sans-serif;
}

// ── Toolbar ────────────────────────────────────────────────────────────────
.sv-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: $bg-elevated;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.sv-toolbar-left { display: flex; align-items: center; gap: 12px; }
.sv-toolbar-right { display: flex; align-items: center; gap: 6px; }

.sv-logo {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 600; color: $text-heading;
  svg { color: var(--accent); }
}

.sv-tbtn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover { border-color: var(--accent); color: $text-heading; background: var(--accent-subtle); }
}

// ── Workspace ──────────────────────────────────────────────────────────────
.sv-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ── Panes ──────────────────────────────────────────────────────────────────
.sv-pane {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  &--code    { width: 42%; border-right: 1px solid var(--border-subtle); position: relative; }
  &--preview { flex: 1; }
}

.sv-pane--code.is-dragging {
  background: var(--accent-subtle);
  &::after {
    content: 'Drop SVG here';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    border: 2px dashed var(--accent);
    border-radius: 0;
    pointer-events: none;
    z-index: 10;
  }
}

.sv-pane-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 12px 0;
  background: $bg-elevated;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.sv-tab {
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: 8px 8px 0 0;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-400;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: $text-heading; background: var(--accent-subtle); }
  &.active { color: $text-heading; background: $bg-surface; }
}

.sv-theme-group {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding-bottom: 4px;
}

.sv-theme-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 11px; font-weight: 600;
  color: $brand-400;
  cursor: pointer;
  outline: none;
  transition: all 0.15s;
  &:hover { color: $text-heading; }
  &.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: none; }
}

// ── Code editor (overlay pattern) ─────────────────────────────────────────
.sv-editor-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}

%editor-base {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 16px;
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre;
  overflow: auto;
  tab-size: 2;
  word-break: break-all;
  white-space: pre-wrap;
}

.sv-highlight {
  @extend %editor-base;
  background: $bg-surface;
  color: transparent;
  pointer-events: none;
  user-select: none;
  border: none;
  z-index: 1;

  // Token colours
  :deep(.hl-tag)     { color: #e06c75; }       // tag names  — red
  :deep(.hl-punct)   { color: #abb2bf; }        // < > />     — grey
  :deep(.hl-attr)    { color: #61afef; }        // attr names — blue
  :deep(.hl-str)     { color: #98c379; }        // string val — green
  :deep(.hl-quot)    { color: #56b6c2; }        // quotes     — teal
  :deep(.hl-hex)     { color: var(--hc, #e5c07b); font-weight: 600; } // hex — its own color
  :deep(.hl-comment) { color: #7f848e; font-style: italic; }
  :deep(.hl-plain)   { color: #abb2bf; }
}

.sv-code-editor {
  @extend %editor-base;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: transparent;
  caret-color: #fff;
  z-index: 2;
  &::placeholder { color: rgba(167,139,250,0.25); }
}

// ── Preview area ───────────────────────────────────────────────────────────
.sv-preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: default;
  transition: background 0.2s;

  &.bg-dark    { background: #111118; }
  &.bg-light   { background: #f8f8fa; }
  &.bg-checker {
    background-image:
      linear-gradient(45deg, #2a2a3a 25%, transparent 25%),
      linear-gradient(-45deg, #2a2a3a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #2a2a3a 75%),
      linear-gradient(-45deg, transparent 75%, #2a2a3a 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    background-color: #1e1e2e;
  }

  &.dragging {
    outline: 2px dashed var(--accent);
    outline-offset: -8px;
  }
}

.sv-drop-hint {
  text-align: center;
  pointer-events: none;
  user-select: none;
}

.sv-drop-icon {
  color: $brand-600;
  margin-bottom: 14px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.sv-drop-title {
  font-size: 14px;
  font-weight: 600;
  color: $brand-400;
  margin-bottom: 6px;
}

.sv-drop-sub {
  font-size: 12px;
  color: $brand-600;
}

.sv-svg-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
  transition: transform 0.15s ease;
  :deep(svg) { max-width: 220px; max-height: 220px; display: block; }
}

// ── Status bar ─────────────────────────────────────────────────────────────
.sv-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: $bg-elevated;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.sv-status-left  { display: flex; align-items: center; gap: 10px; }
.sv-status-right { display: flex; align-items: center; gap: 10px; }

.sv-stat        { font-size: 12px; color: $brand-400; }
.sv-stat-dim    { font-family: monospace; font-weight: 600; color: $text-heading; }
.sv-stat-muted  { color: $brand-600; }

.sv-stat-badge {
  background: var(--accent-subtle);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.sv-stat-fill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: monospace;
  font-size: 11px;
  color: $brand-300;
}

.sv-fill-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.15);
}

.sv-zoom-group {
  display: flex;
  align-items: center;
  gap: 4px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 2px 4px;
}

.sv-zoom-btn {
  width: 22px; height: 22px;
  background: transparent; border: none;
  color: $brand-400; font-size: 16px; line-height: 1;
  cursor: pointer; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &:hover { background: $bg-elevated; color: var(--accent); }
}

.sv-zoom-val {
  font-size: 11px; font-weight: 600;
  color: $brand-300;
  width: 36px;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Inter', sans-serif;
  appearance: none;
  -moz-appearance: textfield;
  &::-webkit-inner-spin-button { -webkit-appearance: none; }
  &:hover, &:focus { color: #fff; }
}

.sv-zoom-pct {
  font-size: 11px; font-weight: 600;
  color: $brand-400;
  margin-left: -2px;
}

.sv-export-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  background: var(--accent);
  border: none; border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 600;
  color: #fff; cursor: pointer;
  transition: all 0.15s;
  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.35; cursor: default; }
}

// ── Icon library panel ─────────────────────────────────────────────────────
.sv-icon-lib {
  position: absolute;
  top: 52px;
  right: 0;
  width: 340px;
  max-height: calc(100% - 52px - 44px);
  background: $bg-surface;
  border-left: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.sv-il-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.sv-il-title {
  font-size: 12px; font-weight: 700;
  color: $text-heading;
  flex-shrink: 0;
}

.sv-il-search {
  flex: 1;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 5px 10px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #fff;
  outline: none;
  &:focus { border-color: var(--accent); }
  &::placeholder { color: $brand-600; }
}

.sv-il-close {
  background: transparent; border: none;
  color: $brand-500; font-size: 12px;
  cursor: pointer; padding: 4px;
  border-radius: 4px;
  &:hover { color: #f87171; }
}

.sv-il-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 10px;
  overflow-y: auto;
  flex: 1;
}

.sv-il-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: var(--accent-subtle);
    border-color: var(--accent);
  }
}

.sv-il-svg {
  color: $brand-300;
  display: flex;
  :deep(svg) { display: block; }
}

.sv-il-name {
  font-size: 9px;
  font-weight: 500;
  color: $brand-500;
  text-align: center;
  line-height: 1.2;
}

// ── Transitions ────────────────────────────────────────────────────────────
.panel-slide-enter-active, .panel-slide-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { opacity: 0; transform: translateX(12px); }
</style>
