<template>
  <div class="pf">
    <label class="ds-field">
      <span class="ds-label">Project name</span>
      <input class="ds-input" type="text" :value="modelValue.name" @input="set('name', $event.target.value)" placeholder="e.g. Landing page redesign" autofocus />
    </label>

    <label class="ds-field">
      <span class="ds-label">Description <span class="opt">optional</span></span>
      <textarea class="ds-input ds-textarea" :value="modelValue.description" @input="set('description', $event.target.value)" rows="3" placeholder="What are you building?"></textarea>
    </label>

    <div class="ds-field">
      <span class="ds-label">Tags <span class="opt">optional</span></span>
      <div v-if="modelValue.tags.length" class="pf-tags">
        <span v-for="t in modelValue.tags" :key="t" class="ds-badge ds-badge-violet">
          {{ t }}
          <button type="button" class="pf-tag-rm" @click="removeTag(t)" :aria-label="`Remove ${t}`">×</button>
        </span>
      </div>
      <div class="pf-tag-row">
        <input class="ds-input" :value="tagInput" @input="$emit('update:tagInput', $event.target.value)" placeholder="e.g. Frontend, MVP, Urgent" @keydown.enter.prevent="$emit('add-tag')" />
        <button type="button" class="ds-btn" @click="$emit('add-tag')" :disabled="!tagInput.trim()">Add</button>
      </div>
    </div>

    <div class="pf-two">
      <div class="ds-field">
        <span class="ds-label">Colour</span>
        <div class="pf-colors" role="radiogroup" aria-label="Project colour">
          <button
            v-for="c in colors" :key="c"
            type="button"
            class="pf-color"
            :class="{ selected: modelValue.color === c }"
            :style="{ background: c }"
            role="radio" :aria-checked="modelValue.color === c" :aria-label="c"
            @click="set('color', c)"
          ></button>
        </div>
      </div>
      <div class="ds-field">
        <span class="ds-label">Icon</span>
        <div class="pf-emojis" role="radiogroup" aria-label="Project icon">
          <button
            v-for="e in emojis" :key="e"
            type="button"
            class="pf-emoji"
            :class="{ selected: modelValue.emoji === e }"
            role="radio" :aria-checked="modelValue.emoji === e"
            @click="set('emoji', e)"
          >{{ e }}</button>
        </div>
      </div>
    </div>

    <div class="ds-field">
      <span class="ds-label">Quarter <span class="opt">optional</span></span>
      <div class="pf-quarter">
        <div class="pf-year">
          <button type="button" class="ds-icon-btn ds-icon-btn-sm ds-icon-btn-outline" @click="$emit('update:year', year - 1)" aria-label="Previous year">
            <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>
          </button>
          <span class="pf-year-val ds-num">{{ year }}</span>
          <button type="button" class="ds-icon-btn ds-icon-btn-sm ds-icon-btn-outline" @click="$emit('update:year', year + 1)" aria-label="Next year">
            <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
          </button>
        </div>
        <div class="ds-segmented pf-q">
          <button
            v-for="qq in quarters" :key="qq.q"
            type="button"
            class="ds-seg-item"
            :aria-pressed="quarter === qq.q"
            :title="qq.months"
            @click="$emit('update:quarter', quarter === qq.q ? '' : qq.q)"
          >{{ qq.q }}</button>
        </div>
      </div>
      <span class="ds-help">{{ quarter ? `Grouped under ${quarter} ${year} · ${monthsFor(quarter)}` : 'Not assigned to a quarter.' }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },   // { name, description, color, emoji, tags }
  tagInput:   { type: String, default: '' },
  year:       { type: Number, required: true },
  quarter:    { type: String, default: '' },
  colors:     { type: Array, default: () => [] },
  emojis:     { type: Array, default: () => [] },
  quarters:   { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'update:tagInput', 'update:year', 'update:quarter', 'add-tag'])

function set(key, value) { emit('update:modelValue', { ...props.modelValue, [key]: value }) }
function removeTag(t) { set('tags', props.modelValue.tags.filter(x => x !== t)) }
function monthsFor(q) { return props.quarters.find(x => x.q === q)?.months || '' }
</script>

<style lang="scss" scoped>
.pf { display: flex; flex-direction: column; gap: var(--space-4); }
.ds-field { min-width: 0; }
.opt { font-weight: 500; color: var(--ink-faint); margin-left: var(--space-1); }
.pf-tags { display: flex; flex-wrap: wrap; gap: var(--space-1); margin-bottom: var(--space-1); }
.pf-tag-rm { border: 0; background: transparent; color: inherit; font-size: 14px; line-height: 1; cursor: pointer; padding: 0 0 0 2px; opacity: .7; &:hover { opacity: 1; } }
.pf-tag-row { display: flex; gap: var(--space-2); }
.pf-two { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.pf-colors, .pf-emojis { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.pf-color {
  width: 26px; height: 26px; border-radius: var(--radius-full); border: 2px solid transparent; cursor: pointer; padding: 0;
  box-shadow: 0 0 0 2px var(--bg-100);
  transition: transform 120ms;
  &.selected { box-shadow: 0 0 0 2px var(--bg-100), 0 0 0 4px var(--ink); }
  &:hover { transform: scale(1.1); }
}
.pf-emoji {
  width: 34px; height: 34px; border-radius: var(--radius-sm); border: 1px solid var(--line); background: var(--bg-200); font-size: 16px; cursor: pointer;
  display: inline-grid; place-items: center;
  &:hover { border-color: var(--line-strong); }
  &.selected { border-color: var(--peach); background: var(--peach-soft); }
}
.pf-quarter { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.pf-year { display: inline-flex; align-items: center; gap: var(--space-1); }
.pf-year-val { min-width: 48px; text-align: center; font-weight: 600; }
.pf-q .ds-seg-item { min-width: 44px; }
</style>
