<template>
  <div class="testing-checklist">
    <div class="overall-progress">
      <div class="prog-label">
        <span>Overall Progress</span>
        <span class="prog-pct">{{ overallPct }}%</span>
      </div>
      <div class="prog-bar"><div class="prog-fill" :style="{ width: overallPct + '%' }"></div></div>
    </div>

    <div class="category-list">
      <div v-for="cat in categories" :key="cat.name" class="category">
        <div class="cat-header">
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-count">{{ catDone(cat) }}/{{ cat.items.length }}</span>
          <div class="cat-bar"><div class="cat-fill" :style="{ width: catPct(cat) + '%' }"></div></div>
        </div>
        <div class="cat-items">
          <label v-for="item in cat.items" :key="item.id" class="check-item">
            <input type="checkbox" v-model="item.done" @change="save" class="check-box" />
            <span :class="{ done: item.done }">{{ item.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn" @click="resetAll">Reset All</button>
      <button class="action-btn primary" @click="exportText">Export as Text</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({ projectId: String })
const LS_KEY = computed(() => `devshop_tool_${props.projectId}_testing-checklist`)

const categories = ref([
  { name: 'Functionality', items: [
    { id: 1, label: 'All features work as expected', done: false },
    { id: 2, label: 'Error states are handled gracefully', done: false },
    { id: 3, label: 'Forms validate input correctly', done: false },
    { id: 4, label: 'Navigation works correctly', done: false },
    { id: 5, label: 'API endpoints return correct data', done: false },
  ]},
  { name: 'Performance', items: [
    { id: 6, label: 'Page loads in under 3 seconds', done: false },
    { id: 7, label: 'Images are optimized', done: false },
    { id: 8, label: 'No console errors or warnings', done: false },
    { id: 9, label: 'Lazy loading is implemented', done: false },
  ]},
  { name: 'Accessibility', items: [
    { id: 10, label: 'All images have alt text', done: false },
    { id: 11, label: 'Keyboard navigation works', done: false },
    { id: 12, label: 'Color contrast meets WCAG AA', done: false },
    { id: 13, label: 'Focus indicators are visible', done: false },
    { id: 14, label: 'ARIA labels are used correctly', done: false },
  ]},
  { name: 'Cross-browser', items: [
    { id: 15, label: 'Works in Chrome', done: false },
    { id: 16, label: 'Works in Firefox', done: false },
    { id: 17, label: 'Works in Safari', done: false },
    { id: 18, label: 'Works in Edge', done: false },
  ]},
  { name: 'Responsive', items: [
    { id: 19, label: 'Works on mobile (320px+)', done: false },
    { id: 20, label: 'Works on tablet (768px)', done: false },
    { id: 21, label: 'Works on desktop (1280px+)', done: false },
    { id: 22, label: 'No horizontal scrollbar on mobile', done: false },
  ]},
  { name: 'SEO & Security', items: [
    { id: 23, label: 'Meta tags are present', done: false },
    { id: 24, label: 'HTTPS is enabled', done: false },
    { id: 25, label: 'No sensitive data in client code', done: false },
    { id: 26, label: 'Canonical URLs are set', done: false },
  ]},
])

const totalItems = computed(() => categories.value.reduce((s, c) => s + c.items.length, 0))
const totalDone = computed(() => categories.value.reduce((s, c) => s + c.items.filter(i => i.done).length, 0))
const overallPct = computed(() => Math.round((totalDone.value / totalItems.value) * 100))

function catDone(cat) { return cat.items.filter(i => i.done).length }
function catPct(cat) { return Math.round((catDone(cat) / cat.items.length) * 100) }

function save() {
  const data = categories.value.map(c => ({ name: c.name, items: c.items.map(i => ({ id: i.id, done: i.done })) }))
  localStorage.setItem(LS_KEY.value, JSON.stringify(data))
}

onMounted(() => {
  const saved = localStorage.getItem(LS_KEY.value)
  if (saved) {
    const data = JSON.parse(saved)
    data.forEach(c => {
      const cat = categories.value.find(x => x.name === c.name)
      if (cat) c.items.forEach(i => { const item = cat.items.find(x => x.id === i.id); if (item) item.done = i.done })
    })
  }
})

function resetAll() {
  categories.value.forEach(c => c.items.forEach(i => i.done = false))
  save()
}

function exportText() {
  let text = 'Testing Checklist\n' + '='.repeat(40) + '\n\n'
  categories.value.forEach(c => {
    text += `${c.name} (${catDone(c)}/${c.items.length})\n`
    c.items.forEach(i => { text += `  [${i.done ? 'x' : ' '}] ${i.label}\n` })
    text += '\n'
  })
  navigator.clipboard.writeText(text)
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.overall-progress {
  margin-bottom: 24px;
  .prog-label { display: flex; justify-content: space-between; font-size: 13px; color: $brand-300; margin-bottom: 8px; }
  .prog-pct { color: #fff; font-weight: 600; }
}

.prog-bar { height: 8px; background: $bg-elevated; border-radius: 4px; overflow: hidden; }
.prog-fill { height: 100%; background: linear-gradient(90deg, $brand-600, $brand-500); border-radius: 4px; transition: width 0.3s; }

.category { margin-bottom: 20px; background: $bg-elevated; border-radius: $radius-md; padding: 16px; }

.cat-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
  .cat-name { font-size: 13px; font-weight: 600; color: #fff; }
  .cat-count { font-size: 12px; color: $brand-400; margin-left: auto; flex-shrink: 0; }
}

.cat-bar { width: 80px; height: 4px; background: $bg-surface; border-radius: 2px; overflow: hidden; }
.cat-fill { height: 100%; background: $brand-500; border-radius: 2px; transition: width 0.3s; }

.cat-items { display: flex; flex-direction: column; gap: 8px; }

.check-item {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: $brand-300;
  span.done { text-decoration: line-through; color: $brand-400; }
}

.check-box { width: 15px; height: 15px; accent-color: $brand-500; flex-shrink: 0; cursor: pointer; }

.actions { display: flex; gap: 10px; margin-top: 20px; }

.action-btn {
  padding: 8px 16px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: $brand-700; color: #fff; }
  &.primary { background: $brand-600; color: #fff; border-color: $brand-500; &:hover { background: $brand-500; } }
}
</style>
