<template>
  <div class="tool-selector">
    <AppNavbar :show-username="false">
      <template #right>
        <span style="font-size:13px;font-weight:500;color:#c4b5fd;">{{ user?.name || user?.email }}</span>
      </template>
    </AppNavbar>

    <main class="main">
      <router-link :to="`/project/${projectId}`" class="back-link">← Back to Dashboard</router-link>

      <div class="page-header">
        <h1 class="page-title">Add Tools to Your Project</h1>
        <p class="page-subtitle">Select the tools you want in this project. You can add or remove them anytime.</p>
      </div>

      <div class="project-pill">
        <div class="project-dot" :style="{ background: project?.color || '#7c3aed' }"></div>
        {{ project?.name || 'Project' }}
      </div>

      <!-- Category filters -->
      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat"
          class="cat-tab"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat"
        >{{ cat }}</button>
      </div>

      <!-- Tools grid -->
      <div class="tools-grid">
        <div
          v-for="tool in filteredTools"
          :key="tool.id"
          class="tool-card"
          :class="{
            selected: selectedTools.includes(tool.id),
            disabled: tool.disabled
          }"
          @click="!tool.disabled && toggleTool(tool.id)"
        >
          <div v-if="tool.disabled" class="tool-soon">Coming Soon</div>
          <div v-else-if="selectedTools.includes(tool.id)" class="tool-check">✓</div>
          <div class="tool-icon">{{ tool.icon }}</div>
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.desc }}</div>
          <span class="tool-tag">{{ tool.category }}</span>
        </div>
      </div>
    </main>

    <!-- Bottom bar -->
    <div class="bottom-bar">
      <div class="selected-count">
        <div class="count-badge">{{ selectedTools.length }}</div>
        <span class="count-text"><strong>{{ selectedTools.length }} tool{{ selectedTools.length !== 1 ? 's' : '' }}</strong> selected</span>
      </div>
      <div class="bar-actions">
        <button class="btn-ghost" @click="$router.push(projectId ? `/project/${projectId}` : '/dashboard')">Skip for now</button>
        <button class="btn-primary" :disabled="selectedTools.length === 0 || saving" @click="saveTools">
          <span v-if="saving" class="spinner"></span>
          <span v-else>Add to Project →</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import { TOOLS } from '@/config/tools'

const store = useStore()
const router = useRouter()
const route = useRoute()

const projectId = route.params.id
const saving = ref(false)
const activeCategory = ref('All Tools')

const user = computed(() => store.getters['auth/currentUser'])
const project = computed(() => store.getters['projects/projectById'](projectId))

const categories = ['All Tools', 'CSS & Layout', 'Productivity', 'Code', 'Testing', 'Design']

const filteredTools = computed(() => {
  if (activeCategory.value === 'All Tools') return TOOLS
  return TOOLS.filter(t => t.category === activeCategory.value)
})

const selectedTools = ref([])

onMounted(async () => {
  if (!project.value) {
    await store.dispatch('projects/fetchProjects')
  }
  if (project.value) {
    selectedTools.value = [...(project.value.tools || [])]
  }
})

function toggleTool(id) {
  const tool = TOOLS.find(t => t.id === id)
  if (!tool || tool.disabled) return
  const idx = selectedTools.value.indexOf(id)
  if (idx === -1) selectedTools.value.push(id)
  else selectedTools.value.splice(idx, 1)
}

async function saveTools() {
  saving.value = true
  await store.dispatch('projects/updateProject', {
    id: projectId,
    data: { tools: selectedTools.value, toolOrder: selectedTools.value }
  })
  saving.value = false
  store.dispatch('ui/toast', { message: 'Tools updated!', type: 'success' })
  router.push(`/project/${projectId}`)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.tool-selector { min-height: 100vh; background: $bg-primary; padding-bottom: 80px; }

.main { padding: 32px 36px 120px; max-width: 1100px; margin: 0 auto; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $brand-400;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  padding: 5px 0;
  margin-bottom: 16px;
  &:hover { color: #fff; }
}

.page-header { margin-bottom: 8px; }
.page-title { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
.page-subtitle { font-size: 13px; color: $brand-400; margin-top: 5px; line-height: 1.5; }

.project-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: $brand-300;
  margin: 14px 0 28px;
}

.project-dot { width: 8px; height: 8px; border-radius: 50%; }

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.cat-tab {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: $brand-400;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &.active, &:hover {
    background: $brand-700;
    border-color: $brand-600;
    color: #fff;
  }
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}

.tool-card {
  background: $bg-surface;
  border: 2px solid var(--border-subtle);
  border-radius: $radius-lg;
  padding: 18px 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  user-select: none;
  &:hover:not(.disabled) { border-color: var(--accent-glow); transform: translateY(-1px); }
  &.selected {
    border-color: $brand-500;
    background: var(--accent-subtle);
    .tool-icon { background: var(--accent-subtle); }
    .tool-tag { background: var(--accent-subtle); color: $brand-300; }
  }
  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    filter: grayscale(0.4);
    .tool-name, .tool-desc { color: $brand-400; }
  }
}

.tool-soon {
  position: absolute;
  top: 10px; right: 10px;
  background: var(--border-strong);
  border: 1px solid var(--border-strong);
  border-radius: 20px;
  font-size: 9px;
  font-weight: 600;
  color: $brand-400;
  padding: 2px 7px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tool-check {
  position: absolute;
  top: 10px; right: 10px;
  width: 20px; height: 20px;
  background: $brand-500;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  color: #fff;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.tool-icon {
  width: 40px; height: 40px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  margin-bottom: 12px;
  background: $bg-elevated;
}

.tool-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; letter-spacing: -0.1px; }
.tool-desc { font-size: 11px; color: $brand-400; line-height: 1.5; }

.tool-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 20px;
  margin-top: 10px;
  background: $bg-elevated;
  color: $brand-400;
}

.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: $bg-surface;
  border-top: 1px solid var(--border-strong);
  padding: 16px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.3);
}

.selected-count { display: flex; align-items: center; gap: 10px; }

.count-badge {
  width: 28px; height: 28px;
  background: $brand-600;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.count-text { font-size: 13px; color: $brand-300; strong { color: #fff; } }

.bar-actions { display: flex; gap: 10px; align-items: center; }

.btn-ghost {
  padding: 9px 18px;
  background: $bg-elevated;
  border: none;
  border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: $brand-700; color: #fff; }
}

.btn-primary {
  padding: 9px 22px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 10px var(--accent-glow);
  display: flex; align-items: center; gap: 6px;
  &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px var(--accent-glow); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
