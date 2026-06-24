<template>
  <div class="flexbox-playground">
    <div class="controls-grid">
      <div class="control-group">
        <label>flex-direction</label>
        <select v-model="container.flexDirection">
          <option>row</option><option>row-reverse</option><option>column</option><option>column-reverse</option>
        </select>
      </div>
      <div class="control-group">
        <label>flex-wrap</label>
        <select v-model="container.flexWrap">
          <option>nowrap</option><option>wrap</option><option>wrap-reverse</option>
        </select>
      </div>
      <div class="control-group">
        <label>justify-content</label>
        <select v-model="container.justifyContent">
          <option>flex-start</option><option>flex-end</option><option>center</option><option>space-between</option><option>space-around</option><option>space-evenly</option>
        </select>
      </div>
      <div class="control-group">
        <label>align-items</label>
        <select v-model="container.alignItems">
          <option>stretch</option><option>flex-start</option><option>flex-end</option><option>center</option><option>baseline</option>
        </select>
      </div>
      <div class="control-group">
        <label>gap</label>
        <input type="number" v-model.number="container.gap" min="0" max="48" />
      </div>
    </div>

    <div class="preview-container" :style="containerStyle">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="flex-item"
        :class="{ selected: selectedItem === i }"
        @click="selectedItem = i"
        :style="itemStyle(item)"
      >{{ i + 1 }}</div>
    </div>

    <div class="item-controls" v-if="selectedItem !== null && items[selectedItem]">
      <div class="item-header">
        <span>Item {{ selectedItem + 1 }} Properties</span>
        <button class="del-item" @click="removeItem(selectedItem)">Remove</button>
      </div>
      <div class="controls-grid">
        <div class="control-group">
          <label>flex-grow</label>
          <input type="number" v-model.number="items[selectedItem].flexGrow" min="0" max="10" />
        </div>
        <div class="control-group">
          <label>flex-shrink</label>
          <input type="number" v-model.number="items[selectedItem].flexShrink" min="0" max="10" />
        </div>
        <div class="control-group">
          <label>flex-basis</label>
          <input type="text" v-model="items[selectedItem].flexBasis" placeholder="auto" />
        </div>
        <div class="control-group">
          <label>align-self</label>
          <select v-model="items[selectedItem].alignSelf">
            <option>auto</option><option>flex-start</option><option>flex-end</option><option>center</option><option>stretch</option>
          </select>
        </div>
      </div>
    </div>

    <div class="actions-row">
      <button class="add-btn" @click="addItem" :disabled="items.length >= 8">+ Add Item</button>
    </div>

    <div class="css-output">
      <div class="css-label">Container CSS</div>
      <code>{{ containerCSS }}</code>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ projectId: String })

const container = ref({ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: 8 })

const items = ref([
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' },
  { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' },
  { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' },
])

const selectedItem = ref(null)

const containerStyle = computed(() => ({
  display: 'flex',
  flexDirection: container.value.flexDirection,
  flexWrap: container.value.flexWrap,
  justifyContent: container.value.justifyContent,
  alignItems: container.value.alignItems,
  gap: `${container.value.gap}px`,
}))

function itemStyle(item) {
  return {
    flexGrow: item.flexGrow,
    flexShrink: item.flexShrink,
    flexBasis: item.flexBasis,
    alignSelf: item.alignSelf,
  }
}

const containerCSS = computed(() => `display: flex;\nflex-direction: ${container.value.flexDirection};\nflex-wrap: ${container.value.flexWrap};\njustify-content: ${container.value.justifyContent};\nalign-items: ${container.value.alignItems};\ngap: ${container.value.gap}px;`)

function addItem() {
  items.value.push({ flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto' })
}

function removeItem(i) {
  items.value.splice(i, 1)
  selectedItem.value = null
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.controls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }

.control-group { label { display: block; font-size: 11px; font-weight: 600; color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; } select, input { width: 100%; background: $bg-elevated; border: 1px solid var(--border-subtle); border-radius: $radius-sm; padding: 7px 10px; font-family: 'Inter', sans-serif; font-size: 13px; color: #fff; outline: none; &:focus { border-color: $brand-500; } } }

.preview-container { min-height: 160px; background: $bg-elevated; border-radius: $radius-lg; padding: 16px; margin-bottom: 20px; border: 2px dashed var(--accent-subtle); }

.flex-item { min-width: 60px; min-height: 60px; background: $brand-700; border-radius: $radius-sm; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; &:hover, &.selected { border-color: $brand-400; background: $brand-600; } }

.item-controls { background: $bg-elevated; border-radius: $radius-md; padding: 16px; margin-bottom: 16px; }
.item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: $brand-300; font-weight: 600; }
.del-item { background: transparent; border: none; color: $brand-400; font-size: 12px; cursor: pointer; &:hover { color: #f87171; } }

.actions-row { margin-bottom: 20px; }
.add-btn { padding: 8px 16px; background: $brand-700; border: 1px dashed var(--accent-glow); border-radius: $radius-md; color: $brand-300; font-size: 12px; cursor: pointer; transition: all 0.2s; &:hover:not(:disabled) { background: $brand-600; color: #fff; } &:disabled { opacity: 0.5; } }

.css-output { background: $bg-elevated; border-radius: $radius-md; padding: 16px; }
.css-label { font-size: 11px; font-weight: 600; color: rgba(167,139,250,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
code { display: block; font-size: 12px; color: $brand-300; font-family: monospace; white-space: pre; }
</style>
