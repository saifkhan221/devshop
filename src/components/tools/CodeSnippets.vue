<template>
  <div class="code-snippets">
    <div class="search-bar">
      <input v-model="search" class="search-input" placeholder="Search snippets..." />
      <button class="add-btn" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ New Snippet' }}</button>
    </div>

    <div v-if="showForm" class="add-form">
      <input v-model="newSnippet.title" class="form-input" placeholder="Snippet title" />
      <select v-model="newSnippet.lang" class="form-select">
        <option v-for="l in langs" :key="l" :value="l">{{ l }}</option>
      </select>
      <textarea v-model="newSnippet.code" class="form-code" rows="6" placeholder="Paste your code here..."></textarea>
      <button class="save-btn" @click="addSnippet" :disabled="!newSnippet.title || !newSnippet.code">Save Snippet</button>
    </div>

    <div v-if="filteredSnippets.length === 0" class="empty">No snippets yet. Create your first one!</div>

    <div v-for="snippet in filteredSnippets" :key="snippet.id" class="snippet-item">
      <div class="snippet-header" @click="toggle(snippet.id)">
        <div class="snippet-meta">
          <span class="snippet-title">{{ snippet.title }}</span>
          <span class="lang-badge">{{ snippet.lang }}</span>
        </div>
        <div class="snippet-actions" @click.stop>
          <button class="icon-btn" @click="copySnippet(snippet.code)">Copy</button>
          <button class="icon-btn del" @click="deleteSnippet(snippet.id)">✕</button>
        </div>
      </div>
      <pre v-if="expanded.includes(snippet.id)" class="snippet-code">{{ snippet.code }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

const { data: snippets, save } = useToolStorage(props.projectId, 'code-snippets', [])

const search = ref('')
const showForm = ref(false)
const expanded = ref([])
const langs = ['JavaScript', 'TypeScript', 'CSS', 'SCSS', 'HTML', 'Vue', 'Python', 'Bash', 'JSON', 'Other']

const newSnippet = ref({ title: '', lang: 'JavaScript', code: '' })

const filteredSnippets = computed(() => {
  if (!search.value) return snippets.value
  return snippets.value.filter(s => s.title.toLowerCase().includes(search.value.toLowerCase()))
})

watch(snippets, (val) => save(val), { deep: true })

function addSnippet() {
  snippets.value.unshift({ ...newSnippet.value, id: Date.now() })
  newSnippet.value = { title: '', lang: 'JavaScript', code: '' }
  showForm.value = false
}

function deleteSnippet(id) {
  snippets.value = snippets.value.filter(s => s.id !== id)
}

function toggle(id) {
  const idx = expanded.value.indexOf(id)
  if (idx === -1) expanded.value.push(id)
  else expanded.value.splice(idx, 1)
}

async function copySnippet(code) {
  await navigator.clipboard.writeText(code)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.search-bar { display: flex; gap: 10px; margin-bottom: 16px; }
.search-input { flex: 1; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-md; padding: 9px 14px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } &::placeholder { color: rgba(167,139,250,0.4); } }
.add-btn { padding: 9px 16px; background: $brand-600; border: none; border-radius: $radius-md; color: #fff; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; &:hover { background: $brand-500; } }

.add-form { background: $bg-elevated; border-radius: $radius-lg; padding: 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 10px; }
.form-input { background: $bg-surface; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } &::placeholder { color: rgba(167,139,250,0.4); } }
.form-select { background: $bg-surface; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; }
.form-code { background: $bg-surface; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 10px 12px; font-family: monospace; font-size: 13px; color: #fff; outline: none; resize: vertical; &:focus { border-color: $brand-500; } }
.save-btn { padding: 8px 16px; background: linear-gradient(135deg, $brand-600, $brand-500); border: none; border-radius: $radius-md; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; &:disabled { opacity: 0.5; cursor: not-allowed; } }

.empty { text-align: center; padding: 40px; color: $brand-400; font-size: 13px; }

.snippet-item { background: $bg-elevated; border-radius: $radius-md; margin-bottom: 10px; overflow: hidden; }
.snippet-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; cursor: pointer; &:hover { background: var(--border-subtle); } }
.snippet-meta { display: flex; align-items: center; gap: 10px; }
.snippet-title { font-size: 13px; font-weight: 600; color: #fff; }
.lang-badge { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 20px; background: var(--accent-subtle); color: $brand-300; }
.snippet-actions { display: flex; gap: 6px; }
.icon-btn { padding: 4px 10px; background: $bg-surface; border: none; border-radius: 6px; color: $brand-400; font-size: 11px; cursor: pointer; &:hover { color: #fff; background: $brand-700; } &.del:hover { color: #f87171; background: rgba(239,68,68,0.1); } }
.snippet-code { padding: 14px 16px; font-size: 12px; color: $brand-300; font-family: monospace; white-space: pre-wrap; word-break: break-word; border-top: 1px solid var(--border-subtle); max-height: 300px; overflow-y: auto; }
</style>
