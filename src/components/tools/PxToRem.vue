<template>
  <div class="px-to-rem">
    <div class="converter-grid">
      <div class="input-group">
        <label>Pixels (px)</label>
        <div class="input-wrap">
          <input class="big-input" type="number" v-model="px" placeholder="16" @input="onPxInput" />
          <div class="spin-btns">
            <button class="spin-btn" @click="stepPx(1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button class="spin-btn" @click="stepPx(-1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="arrow-icon">⇄</div>
      <div class="input-group">
        <label>REM</label>
        <div class="input-wrap">
          <input class="big-input big-input--rem" type="number" v-model="rem" placeholder="1" @input="onRemInput" />
          <div class="spin-btns">
            <button class="spin-btn" @click="stepRem(0.125)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button class="spin-btn" @click="stepRem(-0.125)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Base font size pills -->
    <div class="base-row">
      <span class="base-label">Base font size:</span>
      <div class="base-pills">
        <button
          v-for="b in bases" :key="b"
          class="base-pill"
          :class="{ active: base === b }"
          :title="b !== 16 ? 'Double-click to remove' : ''"
          @click="pickBase(b)"
          @dblclick="b !== 16 && removeBase(b)"
        >
          {{ b }}px
        </button>
        <template v-if="addingBase">
          <input
            ref="addInputRef"
            class="base-add-input"
            type="number"
            v-model="newBaseVal"
            placeholder="px"
            @keydown.enter="confirmAdd"
            @keydown.escape="cancelAdd"
            @blur="confirmAdd"
          />
        </template>
        <button v-else class="base-pill base-pill--add" @click="startAdd">+</button>
        <span v-if="bases.length > 1" class="base-hint">Double-click a pill to remove</span>
      </div>

      <div class="base-row-actions">
        <button class="save-btn" @click="saveValue" title="Save current value">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save
        </button>
        <button class="copy-btn" @click="copyResult">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>
    </div>

    <!-- Saved values -->
    <div v-if="savedValues.length" class="saved-section">
      <div class="saved-header">
        <span class="section-title" style="margin:0">Saved Values</span>
        <button class="clear-all-btn" @click="clearAll">Clear all</button>
      </div>
      <div class="saved-columns">
        <div v-for="col in savedByBase" :key="col.base" class="saved-col">
          <div class="saved-col-header">base {{ col.base }}px</div>
          <div v-for="s in col.items" :key="s.idx" class="saved-item" @click="loadSaved(s)">
            <div class="saved-vals">
              <span class="saved-px">{{ s.px }}px</span>
              <span class="saved-sep">→</span>
              <span class="saved-rem">{{ s.rem }}rem</span>
            </div>
            <button class="saved-del" @click.stop="deleteSaved(s.idx)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">Quick Reference</div>
    <table class="ref-table">
      <thead>
        <tr>
          <th>Pixels</th>
          <th>REM (base {{ base }})</th>
          <th>Common use</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in quickRef" :key="row.px">
          <td class="px-val">{{ row.px }}px</td>
          <td class="rem-val">{{ (row.px / base).toFixed(3).replace(/\.?0+$/, '') }}rem</td>
          <td class="use-val">{{ row.use }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useToolStorage } from '@/composables/useToolStorage'

const props = defineProps({ projectId: String })

// ── Tool storage (Firebase + localStorage) ────────────────────────
const { data: stored, save: saveStored } = useToolStorage(props.projectId, 'px-to-rem', {
  bases: [16],
  savedValues: [],
})

// ── Values ────────────────────────────────────────────────────────
const px   = ref(16)
const rem  = ref(1)
const base = ref(16)
const copied = ref(false)

function fmt(n) { return parseFloat(n.toFixed(3).replace(/\.?0+$/, '')) || 0 }
function onPxInput()  { rem.value = fmt((parseFloat(px.value)  || 0) / base.value) }
function onRemInput() { px.value  = fmt((parseFloat(rem.value) || 0) * base.value) }
function recalc()     { rem.value = fmt((parseFloat(px.value)  || 0) / base.value) }

function stepPx(n)  { px.value  = Math.max(0, (parseFloat(px.value) || 0) + n); onPxInput() }
function stepRem(n) { rem.value = Math.max(0, parseFloat(((parseFloat(rem.value) || 0) + n).toFixed(3).replace(/\.?0+$/, ''))); onRemInput() }

// ── Base pills ────────────────────────────────────────────────────
const bases = computed({
  get: () => stored.value.bases ?? [16],
  set: (v) => { stored.value.bases = v; saveStored() }
})

// Sync base to first available if needed
watch(bases, (b) => { if (!b.includes(base.value)) base.value = b[0] ?? 16 }, { immediate: true })

function pickBase(val) { base.value = val; recalc() }
function removeBase(val) {
  bases.value = bases.value.filter(b => b !== val)
  if (base.value === val) pickBase(16)
}

const addingBase  = ref(false)
const newBaseVal  = ref('')
const addInputRef = ref(null)

async function startAdd() {
  addingBase.value = true; newBaseVal.value = ''
  await nextTick(); addInputRef.value?.focus()
}
function confirmAdd() {
  const v = parseInt(newBaseVal.value)
  if (v > 0 && !bases.value.includes(v)) {
    const next = [...bases.value, v].sort((a, b) => a - b)
    bases.value = next
    pickBase(v)
  }
  addingBase.value = false; newBaseVal.value = ''
}
function cancelAdd() { addingBase.value = false; newBaseVal.value = '' }

// ── Saved values ──────────────────────────────────────────────────
const savedValues = computed({
  get: () => stored.value.savedValues ?? [],
  set: (v) => { stored.value.savedValues = v; saveStored() }
})

function persistSaved() { saveStored() }

function saveValue() {
  const entry = { px: parseFloat(px.value) || 0, rem: parseFloat(rem.value) || 0, base: base.value }
  const exists = savedValues.value.some(s => s.px === entry.px && s.base === entry.base)
  if (!exists) savedValues.value = [entry, ...savedValues.value]
}

const savedByBase = computed(() => {
  const map = {}
  savedValues.value.forEach((s, idx) => {
    if (!map[s.base]) map[s.base] = []
    map[s.base].push({ ...s, idx })
  })
  return Object.keys(map).sort((a, b) => a - b).map(b => ({ base: Number(b), items: map[b] }))
})

function loadSaved(s) { px.value = s.px; rem.value = s.rem; pickBase(s.base) }
function deleteSaved(i) {
  const next = [...savedValues.value]; next.splice(i, 1); savedValues.value = next
}
function clearAll() { savedValues.value = [] }

// ── Copy ──────────────────────────────────────────────────────────
async function copyResult() {
  await navigator.clipboard.writeText(`${rem.value}rem`)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

// ── Quick reference ───────────────────────────────────────────────
const quickRef = [
  { px: 8,  use: 'Extra small text' },
  { px: 12, use: 'Small labels' },
  { px: 14, use: 'Body text small' },
  { px: 16, use: 'Base / body' },
  { px: 20, use: 'Subheadings' },
  { px: 24, use: 'Headings' },
  { px: 32, use: 'Large headings' },
  { px: 48, use: 'Display' },
]
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.converter-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 28px;
}

.input-group label {
  display: block;
  font-size: 11px; font-weight: 600;
  color: $brand-400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-wrap { position: relative; }

.big-input {
  width: 100%;
  background: $bg-elevated;
  border: 2px solid var(--border-strong);
  border-radius: 12px;
  padding: 16px 52px 16px 18px;
  font-family: 'Inter', sans-serif;
  font-size: 28px; font-weight: 600;
  color: #fff;
  outline: none;
  transition: border-color 0.2s;
  appearance: none; -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  &:focus { border-color: $brand-500; }
  &::placeholder { color: rgba(167,139,250,0.25); }
}

.big-input--rem {
  background: var(--accent-subtle);
  border-color: var(--accent-subtle);
  color: $brand-300;
  &:focus { border-color: $brand-500; }
}

.spin-btns {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 2px;
}

.spin-btn {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; color: $brand-500;
  cursor: pointer; transition: color 0.15s; padding: 0;
  &:hover { color: #fff; }
}

.arrow-icon {
  font-size: 24px; color: $brand-600;
  display: flex; align-items: center; justify-content: center;
  padding-top: 24px;
}

// ── Base row ──────────────────────────────────────────────────────
.base-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: $bg-elevated;
  border-radius: $radius-md;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.base-label { font-size: 13px; color: $brand-400; white-space: nowrap; flex-shrink: 0; }

.base-pills { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }

.base-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 14px;
  background: $bg-surface;
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  color: $brand-300;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  &:hover { border-color: var(--accent); color: #fff; }
  &.active { background: var(--accent-subtle); border-color: $brand-500; color: $brand-300; }
  &--add { padding: 5px 12px; color: $brand-500; border-style: dashed;
    &:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-subtle); } }
}

.base-hint { font-size: 11px; color: $brand-400; font-style: italic; margin-left: 4px; }

.base-add-input {
  width: 56px;
  background: $bg-surface; border: 1px solid var(--accent); border-radius: 20px;
  padding: 5px 10px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
  color: #fff; outline: none; text-align: center;
  appearance: none; -moz-appearance: textfield;
  &::-webkit-outer-spin-button, &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  &::placeholder { color: $brand-600; }
}

.base-row-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }

.save-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  color: $brand-300;
  font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
  &:hover { border-color: var(--accent); color: var(--accent); }
}

.copy-btn {
  padding: 6px 14px;
  background: $brand-600; border: none; border-radius: 8px;
  color: #fff; font-family: 'Inter', sans-serif;
  font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; white-space: nowrap;
  &:hover { background: $brand-500; }
}

// ── Saved values ──────────────────────────────────────────────────
.saved-section {
  margin-bottom: 24px;
  background: $bg-elevated;
  border-radius: $radius-md;
  overflow: hidden;
}

.saved-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.clear-all-btn {
  font-size: 11px; color: $brand-500;
  background: none; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: color 0.15s;
  &:hover { color: #f87171; }
}

.saved-columns {
  display: flex;
  gap: 0;
  padding: 0;
}

.saved-col {
  flex: 1;
  border-right: 1px solid var(--border-subtle);
  &:last-child { border-right: none; }
}

.saved-col-header {
  font-size: 10px; font-weight: 600;
  color: $brand-500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 12px 6px;
  border-bottom: 1px solid var(--border-subtle);
}

.saved-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  &:last-child { border-bottom: none; }
}

.saved-vals { display: flex; align-items: center; gap: 6px; }
.saved-px   { font-size: 12px; font-weight: 600; color: #fff; font-family: monospace; }
.saved-sep  { font-size: 11px; color: $brand-600; }
.saved-rem  { font-size: 12px; font-weight: 600; color: $brand-300; font-family: monospace; }

.saved-del {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 6px;
  color: $brand-600; cursor: pointer; transition: all 0.15s;
  flex-shrink: 0;
  &:hover { background: rgba(239,68,68,.15); color: #f87171; }
}

// ── Quick ref ─────────────────────────────────────────────────────
.section-title {
  font-size: 11px; font-weight: 600;
  color: rgba(167,139,250,0.5);
  letter-spacing: 0.08em; text-transform: uppercase;
  margin-bottom: 12px;
}

.ref-table { width: 100%; border-collapse: collapse; }
.ref-table th {
  text-align: left; font-size: 11px; font-weight: 600;
  color: $brand-400; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 0 12px 10px;
}
.ref-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--border-subtle); }
.ref-table tr:last-child td { border-bottom: none; }
.px-val  { color: $brand-300; font-weight: 500; font-family: monospace; font-size: 14px; }
.rem-val { color: #fff; font-weight: 600; font-family: monospace; font-size: 14px; }
.use-val { color: $brand-400; font-size: 12px; }
</style>
