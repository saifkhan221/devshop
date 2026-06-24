<template>
  <div class="json-formatter">
    <div class="editor-row">
      <div class="pane">
        <div class="pane-header">
          <span class="pane-label">Input</span>
          <div class="pane-actions">
            <button class="act-btn" @click="format">Format</button>
            <button class="act-btn" @click="minify">Minify</button>
            <button class="act-btn" @click="clear">Clear</button>
          </div>
        </div>
        <textarea v-model="input" class="code-area" rows="20" placeholder='Paste JSON here...\n{\n  "name": "DevShop"\n}'></textarea>
      </div>
      <div class="pane">
        <div class="pane-header">
          <span class="pane-label">Output</span>
          <button class="act-btn" @click="copyOutput" :disabled="!output">{{ copied ? 'Copied!' : 'Copy' }}</button>
        </div>
        <div v-if="error" class="error-box">{{ error }}</div>
        <pre v-else class="output-area" v-html="highlighted"></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'

defineProps({ projectId: String })

const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)

const highlighted = computed(() => {
  if (!output.value) return ''
  const raw = output.value
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-num'
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-str'
      } else if (/true|false/.test(match)) {
        cls = 'json-bool'
      } else if (/null/.test(match)) {
        cls = 'json-null'
      }
      return `<span class="${cls}">${match}</span>`
    })
  // Sanitize: only allow span tags with specific classes — no scripts, no iframes
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: ['span'],
    ALLOWED_ATTR: ['class']
  })
})

function format() {
  error.value = ''
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed, null, 2)
  } catch(e) {
    error.value = `Invalid JSON: ${e.message}`
    output.value = ''
  }
}

function minify() {
  error.value = ''
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed)
  } catch(e) {
    error.value = `Invalid JSON: ${e.message}`
    output.value = ''
  }
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}

async function copyOutput() {
  await navigator.clipboard.writeText(output.value)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.editor-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.pane { display: flex; flex-direction: column; }

.pane-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.pane-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; }
.pane-actions { display: flex; gap: 6px; }

.act-btn { padding: 5px 12px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: 6px; color: $brand-300; font-size: 11px; cursor: pointer; transition: all 0.2s; &:hover:not(:disabled) { background: $brand-700; color: #fff; } &:disabled { opacity: 0.5; } }

.code-area { width: 100%; height: 400px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; padding: 12px 14px; font-family: monospace; font-size: 12px; color: #fff; outline: none; resize: vertical; &:focus { border-color: $brand-500; } &::placeholder { color: rgba(167,139,250,0.3); } }

.error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: $radius-md; padding: 12px 14px; font-size: 12px; color: #f87171; font-family: monospace; height: 400px; overflow: auto; }

.output-area { height: 400px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; padding: 12px 14px; font-family: monospace; font-size: 12px; color: #fff; overflow: auto; white-space: pre; margin: 0; }

:deep(.json-key) { color: #a78bfa; }
:deep(.json-str) { color: #6ee7b7; }
:deep(.json-num) { color: #fcd34d; }
:deep(.json-bool) { color: #f87171; }
:deep(.json-null) { color: #94a3b8; }
</style>
