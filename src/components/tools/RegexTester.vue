<template>
  <div class="regex-tester">
    <div class="pattern-row">
      <span class="slash">/</span>
      <input v-model="pattern" class="pattern-input" placeholder="your regex here" />
      <span class="slash">/</span>
      <div class="flags">
        <label v-for="f in availableFlags" :key="f" class="flag-label" :class="{ active: flags.includes(f) }">
          <input type="checkbox" :checked="flags.includes(f)" @change="toggleFlag(f)" style="display:none" />
          {{ f }}
        </label>
      </div>
    </div>

    <div class="presets-row">
      <span class="presets-label">Presets:</span>
      <button v-for="p in presets" :key="p.name" class="preset-btn" @click="applyPreset(p)">{{ p.name }}</button>
    </div>

    <div class="test-area">
      <label class="area-label">Test String</label>
      <div class="highlighted" v-html="highlighted"></div>
      <textarea v-model="testStr" class="test-input" rows="5" placeholder="Enter text to test against..."></textarea>
    </div>

    <div v-if="matches.length > 0" class="matches-section">
      <div class="section-title">{{ matches.length }} match{{ matches.length !== 1 ? 'es' : '' }} found</div>
      <div v-for="(m, i) in matches" :key="i" class="match-item">
        <span class="match-index">{{ m.index }}</span>
        <code class="match-value">{{ m.value }}</code>
      </div>
    </div>

    <div v-else-if="pattern && testStr" class="no-matches">No matches found</div>

    <div v-if="regexError" class="regex-error">{{ regexError }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DOMPurify from 'dompurify'

defineProps({ projectId: String })

const pattern = ref('')
const testStr = ref('')
const flags = ref(['g'])
const availableFlags = ['g', 'i', 'm', 's']
const regexError = ref('')

const presets = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: ['g'] },
  { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b', flags: ['g'] },
  { name: 'Phone', pattern: '(\\+?\\d{1,3}[- ]?)?\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}', flags: ['g'] },
  { name: 'Date', pattern: '\\d{4}[-/]\\d{2}[-/]\\d{2}', flags: ['g'] },
  { name: 'HEX Color', pattern: '#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})', flags: ['g'] },
]

const matches = computed(() => {
  regexError.value = ''
  if (!pattern.value || !testStr.value) return []
  try {
    const re = new RegExp(pattern.value, flags.value.join(''))
    const results = []
    let m
    if (flags.value.includes('g')) {
      while ((m = re.exec(testStr.value)) !== null) {
        results.push({ index: m.index, value: m[0] })
        if (m.index === re.lastIndex) re.lastIndex++
      }
    } else {
      m = re.exec(testStr.value)
      if (m) results.push({ index: m.index, value: m[0] })
    }
    return results
  } catch(e) {
    regexError.value = e.message
    return []
  }
})

const highlighted = computed(() => {
  if (!testStr.value || !pattern.value || matches.value.length === 0) return ''
  try {
    const re = new RegExp(pattern.value, 'g' + flags.value.filter(f => f !== 'g').join(''))
    // Escape user text before injecting into HTML to prevent XSS
    const escaped = testStr.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const raw = escaped.replace(re, m => `<mark class="hl">${m.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</mark>`).replace(/\n/g, '<br>')
    return DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['mark', 'br'], ALLOWED_ATTR: ['class'] })
  } catch { return DOMPurify.sanitize(testStr.value) }
})

function toggleFlag(f) {
  const idx = flags.value.indexOf(f)
  if (idx === -1) flags.value.push(f)
  else flags.value.splice(idx, 1)
}

function applyPreset(p) {
  pattern.value = p.pattern
  flags.value = [...p.flags]
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.pattern-row { display: flex; align-items: center; gap: 8px; background: $bg-elevated; border-radius: $radius-md; padding: 10px 14px; margin-bottom: 12px; }
.slash { font-size: 18px; color: $brand-400; font-family: monospace; }
.pattern-input { flex: 1; background: transparent; border: none; outline: none; font-family: monospace; font-size: 15px; color: #fff; &::placeholder { color: rgba(167,139,250,0.3); } }
.flags { display: flex; gap: 6px; }
.flag-label { padding: 3px 8px; background: $bg-surface; border-radius: 4px; color: $brand-400; font-family: monospace; font-size: 12px; cursor: pointer; transition: all 0.2s; user-select: none; &.active { background: $brand-700; color: #fff; } &:hover { background: $brand-800; } }

.presets-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.presets-label { font-size: 12px; color: $brand-400; }
.preset-btn { padding: 4px 10px; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: 20px; color: $brand-300; font-size: 11px; cursor: pointer; transition: all 0.2s; &:hover { background: $brand-700; color: #fff; } }

.test-area { margin-bottom: 16px; position: relative; }
.area-label { display: block; font-size: 11px; font-weight: 600; color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px; }
.highlighted { position: absolute; top: 28px; left: 0; right: 0; padding: 10px 14px; font-family: monospace; font-size: 13px; color: transparent; pointer-events: none; z-index: 1; white-space: pre-wrap; word-break: break-word; }
:deep(.hl) { background: var(--accent-glow); color: transparent; border-radius: 2px; }
.test-input { width: 100%; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; padding: 10px 14px; font-family: monospace; font-size: 13px; color: #fff; outline: none; resize: vertical; position: relative; z-index: 2; background: transparent; &:focus { border-color: $brand-500; } &::placeholder { color: rgba(167,139,250,0.3); } }

.section-title { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
.matches-section { }
.match-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: $bg-elevated; border-radius: $radius-sm; margin-bottom: 6px; }
.match-index { font-size: 11px; color: $brand-400; min-width: 40px; }
.match-value { font-size: 13px; color: $brand-300; font-family: monospace; background: var(--accent-subtle); padding: 2px 8px; border-radius: 4px; }
.no-matches { text-align: center; padding: 20px; color: $brand-400; font-size: 13px; }
.regex-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: $radius-md; padding: 10px 14px; font-size: 12px; color: #f87171; font-family: monospace; margin-top: 10px; }
</style>
