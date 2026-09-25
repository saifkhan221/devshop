<template>
  <div class="sudoku" tabindex="0" ref="root" @keydown="onKey">
    <div class="s-top">
      <div class="ds-segmented" role="group" aria-label="Difficulty">
        <button
          v-for="d in DIFFS" :key="d.key"
          type="button" class="ds-seg-item"
          :aria-pressed="difficulty === d.key"
          @click="newPuzzle(d.key)"
        >{{ d.label }}</button>
      </div>
      <span class="s-status" :class="{ 'is-win': solved }">
        {{ solved ? 'Solved! 🎉' : `${remaining} left` }}
      </span>
    </div>

    <div class="board" :class="{ done: solved }">
      <button
        v-for="(cell, i) in cells" :key="i"
        class="cell"
        :class="[
          cellEdge(i),
          {
            given: cell.given,
            sel: selected === i,
            peer: isPeer(i),
            same: sameValue(i),
            bad: conflicts.has(i),
          },
        ]"
        :disabled="cell.given"
        @click="select(i)"
      >{{ cell.value || '' }}</button>
    </div>

    <div class="pad">
      <button v-for="n in 9" :key="n" class="ds-btn pad-btn" @click="enter(n)">{{ n }}</button>
      <button class="ds-btn pad-btn pad-erase" @click="enter(0)" aria-label="Erase">
        <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 20H7L3 12l4-8h13a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1z"/><path d="m14 9-4 6M10 9l4 6"/></svg>
      </button>
    </div>

    <button class="ds-btn ds-btn-primary" @click="newPuzzle(difficulty)">New puzzle</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const emit = defineEmits(['result'])

const DIFFS = [
  { key: 'easy',   label: 'Easy',   clues: 44 },
  { key: 'medium', label: 'Medium', clues: 34 },
  { key: 'hard',   label: 'Hard',   clues: 28 },
]

const difficulty = ref('easy')
const cells = ref([])        // [{ value, given }] length 81
const solution = ref([])     // length 81
const selected = ref(null)
const root = ref(null)
const startedAt = ref(0)

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
function patternAt(r, c) { return (3 * (r % 3) + Math.floor(r / 3) + c) % 9 }

function generateSolution() {
  const base = [0, 1, 2]
  const rows = [].concat(...shuffle([...base]).map(g => shuffle([...base]).map(r => g * 3 + r)))
  const colsA = [].concat(...shuffle([...base]).map(g => shuffle([...base]).map(c => g * 3 + c)))
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  const grid = []
  for (const r of rows) for (const c of colsA) grid.push(nums[patternAt(r, c)])
  return grid
}

function newPuzzle(diff) {
  difficulty.value = diff
  const sol = generateSolution()
  solution.value = sol
  const clues = DIFFS.find(d => d.key === diff).clues
  const keep = new Set(shuffle([...Array(81).keys()]).slice(0, clues))
  cells.value = sol.map((v, i) => keep.has(i) ? { value: v, given: true } : { value: 0, given: false })
  selected.value = null
  startedAt.value = Date.now()
  root.value?.focus()
}

function select(i) { if (!cells.value[i].given) selected.value = i }

function enter(n) {
  const i = selected.value
  if (i === null || cells.value[i].given) return
  cells.value[i] = { value: n, given: false }
}

const remaining = computed(() => cells.value.filter(c => !c.value).length)

const conflicts = computed(() => {
  const bad = new Set()
  const g = cells.value
  const rc = (i) => [Math.floor(i / 9), i % 9]
  for (let i = 0; i < 81; i++) {
    const v = g[i]?.value
    if (!v) continue
    const [r, c] = rc(i)
    for (let j = 0; j < 81; j++) {
      if (j === i || g[j]?.value !== v) continue
      const [r2, c2] = rc(j)
      const sameBox = Math.floor(r / 3) === Math.floor(r2 / 3) && Math.floor(c / 3) === Math.floor(c2 / 3)
      if (r === r2 || c === c2 || sameBox) { bad.add(i); bad.add(j) }
    }
  }
  return bad
})

const solved = computed(() => remaining.value === 0 && conflicts.value.size === 0 && cells.value.length === 81)

function isPeer(i) {
  if (selected.value === null) return false
  const [r, c] = [Math.floor(i / 9), i % 9]
  const [sr, sc] = [Math.floor(selected.value / 9), selected.value % 9]
  const sameBox = Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)
  return i !== selected.value && (r === sr || c === sc || sameBox)
}
function sameValue(i) {
  if (selected.value === null) return false
  const sv = cells.value[selected.value]?.value
  return !!sv && i !== selected.value && cells.value[i]?.value === sv
}

function cellEdge(i) {
  const c = i % 9, r = Math.floor(i / 9)
  return {
    'edge-r': c % 3 === 2 && c !== 8,
    'edge-b': r % 3 === 2 && r !== 8,
  }
}

function onKey(e) {
  if (e.key >= '1' && e.key <= '9') { enter(Number(e.key)); return }
  if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') { enter(0); return }
  if (selected.value === null) return
  const moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }
  if (moves[e.key] !== undefined) {
    e.preventDefault()
    const ni = selected.value + moves[e.key]
    if (ni >= 0 && ni < 81) selected.value = ni
  }
}

watch(solved, (v) => {
  if (v && startedAt.value) {
    emit('result', { game: 'sudoku', diff: difficulty.value, timeSec: Math.round((Date.now() - startedAt.value) / 1000) })
    startedAt.value = 0
  }
})

onMounted(() => { newPuzzle('easy'); root.value?.focus() })
</script>

<style lang="scss" scoped>
.sudoku { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-1) 0 var(--space-2); outline: none; }

.s-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; }
.s-status { font-size: 13px; font-weight: 600; color: var(--ink-muted); }
.s-status.is-win { color: var(--peach-text); }

.board {
  display: grid;
  grid-template-columns: repeat(9, 38px);
  grid-template-rows: repeat(9, 38px);
  background: var(--bg-000);
  border: 2px solid var(--line-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.cell {
  border: 1px solid var(--line-soft);
  background: var(--bg-100);
  color: var(--peach-text);
  font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition: background-color 100ms;
  &:disabled { cursor: default; opacity: 1; }  // given clues stay full-strength
  &.given { color: var(--ink); font-weight: 700; }
  &.peer { background: var(--bg-200); }
  &.same { background: var(--peach-soft); }
  &.sel { background: var(--peach-soft); box-shadow: inset 0 0 0 2px var(--peach); }
  &.bad { color: var(--danger-text); }
  &.edge-r { border-right: 2px solid var(--line-strong); }
  &.edge-b { border-bottom: 2px solid var(--line-strong); }
}
.board.done .cell { background: var(--peach-soft); }

.pad { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2); width: 100%; max-width: 300px; }
.pad-btn { height: 40px; padding: 0; font-size: 16px; font-weight: 700; }
.pad-erase { grid-column: span 1; }

@media (max-width: 560px) {
  .board { grid-template-columns: repeat(9, 32px); grid-template-rows: repeat(9, 32px); }
  .cell { font-size: 16px; }
}
</style>
