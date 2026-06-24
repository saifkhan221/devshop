<template>
  <div class="project-board">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="nav-left">
        <router-link to="/dashboard" class="back-btn">←</router-link>
        <div class="logo-icon">⚡</div>
        <div class="project-dot" :style="{ background: project?.color || '#7c3aed' }"></div>
        <span class="project-name">{{ project?.name || 'Project' }}</span>
      </div>
      <div class="nav-center">
        <div class="tool-count-badge">🔧 {{ toolList.length }} tools active</div>
      </div>
      <div class="nav-right">
        <router-link :to="`/project/${projectId}/setup`" class="btn-add-tools">+ Add Tools</router-link>
        <!-- View toggle -->
        <div class="view-toggle">
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'single' }"
            @click="setViewMode('single')"
            title="Single tool view"
          >
            <span class="toggle-icon">▣</span>
          </button>
          <button
            class="toggle-btn"
            :class="{ active: viewMode === 'all' }"
            @click="setViewMode('all')"
            title="All tools view"
          >
            <span class="toggle-icon">☰</span>
          </button>
        </div>
        <ThemeSelector />
        <div class="nav-avatar">{{ initials }}</div>
        <button class="nav-logout" @click="logout">↩</button>
      </div>
    </nav>

    <!-- Workspace -->
    <div class="workspace">
      <!-- Sidebar -->
      <AppSidebar
        :project-id="projectId"
        :active-tool="activeToolId"
        @tool-select="setActiveTool"
      />

      <!-- Content -->
      <div class="content">

        <!-- SINGLE TOOL VIEW -->
        <template v-if="viewMode === 'single'">
          <template v-if="activeTool">
            <div class="tool-header">
              <div>
                <div class="tool-title">{{ activeTool.name }}</div>
                <div class="tool-subtitle">{{ activeTool.desc }}</div>
              </div>
            </div>
            <div class="tool-panel">
              <component :is="activeToolComponent" :project-id="projectId" />
            </div>
          </template>
          <div v-else class="no-tool">
            <div class="no-tool-icon">🔧</div>
            <div class="no-tool-title">Select a tool from the sidebar</div>
            <div class="no-tool-sub">Choose any tool to start working on your project</div>
            <router-link v-if="toolList.length === 0" :to="`/project/${projectId}/setup`" class="btn-add-tools-empty">
              + Add Tools to Get Started
            </router-link>
          </div>
        </template>

        <!-- ALL TOOLS VIEW -->
        <template v-else>
          <div v-if="toolList.length === 0" class="no-tool">
            <div class="no-tool-icon">🔧</div>
            <div class="no-tool-title">No tools added yet</div>
            <div class="no-tool-sub">Add tools to your project to get started</div>
            <router-link :to="`/project/${projectId}/setup`" class="btn-add-tools-empty">
              + Add Tools to Get Started
            </router-link>
          </div>
          <div v-else class="all-tools-list">
            <template v-for="(tool, index) in toolList" :key="tool.id">
              <div :id="`tool-${tool.id}`" class="tool-block">
                <div class="tool-header">
                  <div>
                    <div class="tool-title">
                      <span class="tool-icon-inline">{{ tool.icon }}</span>
                      {{ tool.name }}
                    </div>
                    <div class="tool-subtitle">{{ tool.desc }}</div>
                  </div>
                  <span class="tool-category-badge">{{ tool.category }}</span>
                </div>
                <div class="tool-panel">
                  <component :is="toolComponents[tool.component]" :project-id="projectId" />
                </div>
              </div>
              <!-- Separator -->
              <div v-if="index < toolList.length - 1" class="tool-separator">
                <span class="separator-line"></span>
                <span class="separator-label">{{ toolList[index + 1]?.icon }} {{ toolList[index + 1]?.name }}</span>
                <span class="separator-line"></span>
              </div>
            </template>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'
import { TOOLS } from '@/config/tools'

const store = useStore()
const router = useRouter()
const route = useRoute()

const projectId = route.params.id
const activeToolId = ref(null)

// View mode: 'single' | 'all'
const VIEW_MODE_KEY = 'devshop_view_mode'
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'single')
function setViewMode(mode) {
  viewMode.value = mode
  localStorage.setItem(VIEW_MODE_KEY, mode)
}

const project = computed(() => store.getters['projects/projectById'](projectId))
const initials = computed(() => store.getters['auth/userInitials'])

const toolList = computed(() => {
  if (!project.value) return []
  const order = project.value.toolOrder || project.value.tools || []
  return order.map(id => TOOLS.find(t => t.id === id)).filter(Boolean)
})

const activeTool = computed(() => TOOLS.find(t => t.id === activeToolId.value))

const toolComponents = {
  PxToRem: defineAsyncComponent(() => import('@/components/tools/PxToRem.vue')),
  RemToPx: defineAsyncComponent(() => import('@/components/tools/RemToPx.vue')),
  BoxShadowGenerator: defineAsyncComponent(() => import('@/components/tools/BoxShadowGenerator.vue')),
  SvgViewer: defineAsyncComponent(() => import('@/components/tools/SvgViewer.vue')),
  TaskList: defineAsyncComponent(() => import('@/components/tools/TaskList.vue')),
  TestingChecklist: defineAsyncComponent(() => import('@/components/tools/TestingChecklist.vue')),
  ColorPalette: defineAsyncComponent(() => import('@/components/tools/ColorPalette.vue')),
  GradientGenerator: defineAsyncComponent(() => import('@/components/tools/GradientGenerator.vue')),
  FlexboxPlayground: defineAsyncComponent(() => import('@/components/tools/FlexboxPlayground.vue')),
  GridBuilder: defineAsyncComponent(() => import('@/components/tools/GridBuilder.vue')),
  BorderRadiusGenerator: defineAsyncComponent(() => import('@/components/tools/BorderRadiusGenerator.vue')),
  FontPairing: defineAsyncComponent(() => import('@/components/tools/FontPairing.vue')),
  ContrastChecker: defineAsyncComponent(() => import('@/components/tools/ContrastChecker.vue')),
  CodeSnippets: defineAsyncComponent(() => import('@/components/tools/CodeSnippets.vue')),
  RegexTester: defineAsyncComponent(() => import('@/components/tools/RegexTester.vue')),
  JsonFormatter: defineAsyncComponent(() => import('@/components/tools/JsonFormatter.vue')),
  KanbanBoard: defineAsyncComponent(() => import('@/components/tools/KanbanBoard.vue')),
  BreakpointTester: defineAsyncComponent(() => import('@/components/tools/BreakpointTester.vue')),
}

const activeToolComponent = computed(() => {
  if (!activeTool.value) return null
  return toolComponents[activeTool.value.component] || null
})

onMounted(async () => {
  if (!project.value) {
    await store.dispatch('projects/fetchProjects')
  }
  // Auto-select first tool
  if (toolList.value.length > 0) {
    activeToolId.value = toolList.value[0].id
  }
})

function setActiveTool(id) {
  activeToolId.value = id
  // In all-tools view, scroll to the tool block
  if (viewMode.value === 'all') {
    setTimeout(() => {
      const el = document.getElementById(`tool-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }
}

async function logout() {
  await store.dispatch('auth/logout')
  router.push('/')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.project-board {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: $bg-primary;
}

.navbar {
  height: 54px;
  background: $bg-surface;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
  z-index: 50;
}

.nav-left { display: flex; align-items: center; gap: 10px; flex: 1; }

.back-btn {
  width: 30px; height: 30px;
  background: $bg-elevated;
  border: none; border-radius: 8px;
  color: $brand-400; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all 0.2s;
  text-decoration: none;
  &:hover { background: $brand-700; color: #fff; }
}

.logo-icon {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}

.project-dot {
  width: 8px; height: 8px; border-radius: 50%;
  box-shadow: 0 0 6px var(--accent-glow);
}

.project-name { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.2px; }

.nav-center { flex: 1; display: flex; justify-content: center; }

.tool-count-badge {
  display: flex; align-items: center; gap: 6px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px; color: $brand-300; font-weight: 500;
}

.nav-right { display: flex; align-items: center; gap: 10px; }

.btn-add-tools {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: $bg-elevated;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  text-decoration: none;
  &:hover { background: $brand-700; color: #fff; }
}

.nav-avatar {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: #fff;
}

.nav-logout {
  width: 30px; height: 30px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: $brand-400;
  font-size: 14px;
  transition: all 0.2s;
  &:hover { background: $bg-elevated; color: #fff; }
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  background: $bg-primary;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 3px; }
}

.tool-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px;
}

.tool-title { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.4px; }
.tool-subtitle { font-size: 13px; color: $brand-400; margin-top: 4px; }

.tool-panel {
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-xl;
  padding: 24px;
}

.no-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  text-align: center;
  .no-tool-icon { font-size: 48px; margin-bottom: 16px; }
  .no-tool-title { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; }
  .no-tool-sub { font-size: 13px; color: $brand-400; margin-bottom: 20px; }
}

.btn-add-tools-empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: $radius-md;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  &:hover { transform: translateY(-1px); }
}

// View toggle
.view-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 3px;
}

.toggle-btn {
  width: 28px; height: 26px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $brand-400;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  transition: all 0.15s;
  &:hover { color: $brand-300; background: var(--border-subtle); }
  &.active {
    background: $brand-600;
    color: #fff;
  }
}

// All tools view
.all-tools-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tool-block {
  padding-bottom: 8px;
}

.tool-icon-inline {
  margin-right: 6px;
}

.tool-category-badge {
  font-size: 11px;
  font-weight: 500;
  color: $brand-400;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
}

.tool-separator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-subtle), transparent);
}

.separator-label {
  font-size: 11px;
  font-weight: 600;
  color: $brand-400;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
