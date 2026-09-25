<template>
  <div class="g2048" tabindex="0" ref="root" @keydown="onKey">
    <div class="g-top">
      <div class="g-status">
        <span v-if="won" class="st st--win">You reached 2048! 🎉</span>
        <span v-else-if="over" class="st st--over">No moves left</span>
        <span v-else class="st">Use arrow keys or swipe</span>
      </div>
      <div class="g-scores">
        <div class="sc"><span>Score</span><b>{{ score }}</b></div>
        <div class="sc sc--best"><span>Best</span><b>{{ best }}</b></div>
      </div>
    </div>

    <div class="board"
      @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div v-for="(cell, i) in flat" :key="i" class="tile" :class="cell ? `tile--${cell}` : 'tile--empty'">
        <span v-if="cell">{{ cell }}</span>
      </div>
    </div>

    <button class="ds-btn ds-btn-primary" @click="reset">New game</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const SIZE = 4
const BEST_KEY = 'devshop_2048_best'

const grid = ref(empty())
const score = ref(0)
const best = ref(Number(localStorage.getItem(BEST_KEY) || 0))
const won = ref(false)
const over = ref(false)
const root = ref(null)

function empty() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(0)) }
const flat = computed(() => grid.value.flat())

function emptyCells(g) {
  const cells = []
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!g[r][c]) cells.push([r, c])
  return cells
}
function spawn(g) {
  const cells = emptyCells(g)
  if (!cells.length) return
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  g[r][c] = Math.random() < 0.9 ? 2 : 4
}

function slide(row) {
  const arr = row.filter(Boolean)
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2
      score.value += arr[i]
      if (arr[i] === 2048) won.value = true
      arr.splice(i + 1, 1)
    }
  }
  while (arr.length < SIZE) arr.push(0)
  return arr
}

const clone = (g) => g.map(r => [...r])
const transpose = (g) => g[0].map((_, c) => g.map(r => r[c]))
const reverse = (g) => g.map(r => [...r].reverse())

function move(dir) {
  if (over.value) return
  let g = clone(grid.value)
  if (dir === 'up') g = transpose(g)
  if (dir === 'down') g = reverse(transpose(g))
  if (dir === 'right') g = reverse(g)
  g = g.map(slide)
  if (dir === 'up') g = transpose(g)
  if (dir === 'down') g = transpose(reverse(g))
  if (dir === 'right') g = reverse(g)

  if (JSON.stringify(g) === JSON.stringify(grid.value)) return  // no change
  spawn(g)
  grid.value = g
  if (score.value > best.value) { best.value = score.value; localStorage.setItem(BEST_KEY, String(best.value)) }
  if (!canMove(g)) over.value = true
}

function canMove(g) {
  if (emptyCells(g).length) return true
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true
    if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true
  }
  return false
}

function reset() {
  grid.value = empty()
  score.value = 0
  won.value = false
  over.value = false
  spawn(grid.value)
  spawn(grid.value)
  root.value?.focus()
}

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
function onKey(e) {
  const dir = KEYS[e.key]
  if (!dir) return
  e.preventDefault()
  move(dir)
}

// Touch swipe
let tx = 0, ty = 0
function onTouchStart(e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY }
function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - tx
  const dy = e.changedTouches[0].clientY - ty
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left')
  else move(dy > 0 ? 'down' : 'up')
}

onMounted(() => { reset(); root.value?.focus() })
onUnmounted(() => {})
</script>

<style lang="scss" scoped>
.g2048 { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-1) 0 var(--space-2); outline: none; }

.g-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); width: 100%; }
.g-status { font-size: 13px; color: var(--ink-muted); }
.st--win { color: var(--peach-text); font-weight: 600; }
.st--over { color: var(--violet-text); font-weight: 600; }
.g-scores { display: flex; gap: var(--space-2); }
.sc {
  display: inline-flex; flex-direction: column; align-items: center;
  padding: var(--space-1) var(--space-3);
  background: var(--bg-200); border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  span { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-muted); }
  b { font-size: 15px; color: var(--ink); font-variant-numeric: tabular-nums; }
}
.sc--best b { color: var(--peach-text); }

.board {
  display: grid;
  grid-template-columns: repeat(4, 72px);
  grid-template-rows: repeat(4, 72px);
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--bg-000);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  touch-action: none;
}
.tile {
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums;
  color: var(--ink);
  transition: background-color 120ms;
}
.tile--empty { background: var(--bg-100); border: 1px solid var(--line-soft); }
.tile span { animation: pop 120ms ease; }

.tile--2    { background: var(--bg-200); }
.tile--4    { background: var(--bg-300); }
.tile--8    { background: var(--peach-soft); color: var(--peach-text); }
.tile--16   { background: var(--peach-soft); color: var(--peach-text); }
.tile--32   { background: var(--peach); color: var(--on-peach); }
.tile--64   { background: var(--peach); color: var(--on-peach); }
.tile--128  { background: var(--peach-strong); color: var(--on-peach); font-size: 21px; }
.tile--256  { background: var(--peach-strong); color: var(--on-peach); font-size: 21px; }
.tile--512  { background: var(--violet-soft); color: var(--violet-text); font-size: 21px; }
.tile--1024 { background: var(--violet); color: var(--on-violet); font-size: 18px; }
.tile--2048 { background: var(--violet); color: var(--on-violet); font-size: 18px; }

@keyframes pop { from { transform: scale(0.6); } to { transform: scale(1); } }
</style>
