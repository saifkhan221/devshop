<template>
  <div class="ttt">
    <div class="ttt-status" :class="'ttt-status--' + status.tone">
      <span class="ttt-dot"></span>
      <span class="st">{{ status.text }}</span>
    </div>

    <div class="ttt-board" :class="{ locked: turn !== 'X' || !!winner, done: !!winner || isDraw }">
      <button
        v-for="(cell, i) in board" :key="i"
        class="ttt-cell"
        :class="{ win: winLine.includes(i) }"
        :disabled="!!cell || turn !== 'X' || !!winner"
        @click="play(i)"
      >
        <span v-if="cell === 'X'" class="mark mark--x">✕</span>
        <span v-else-if="cell === 'O'" class="mark mark--o">◯</span>
        <span v-else class="ghost">✕</span>
      </button>
    </div>

    <div class="ttt-footer">
      <div class="ttt-score">
        <span class="sc sc--x">You <b>{{ score.x }}</b></span>
        <span class="sc sc--d">Draw <b>{{ score.d }}</b></span>
        <span class="sc sc--o">CPU <b>{{ score.o }}</b></span>
      </div>
      <button class="ds-btn ds-btn-primary" @click="reset">New round</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const board = ref(Array(9).fill(null))
const turn = ref('X')          // 'X' = player, 'O' = computer
const winner = ref(null)
const winLine = ref([])
const score = ref({ x: 0, o: 0, d: 0 })

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

const isDraw = computed(() => !winner.value && board.value.every(Boolean))

const status = computed(() => {
  if (winner.value === 'X') return { text: 'You win! 🎉', tone: 'win' }
  if (winner.value === 'O') return { text: 'Computer wins', tone: 'lose' }
  if (isDraw.value)         return { text: "It's a draw", tone: 'draw' }
  if (turn.value === 'X')   return { text: 'Your move', tone: 'you' }
  return { text: 'Computer thinking…', tone: 'wait' }
})

function findWin(b, p) {
  return LINES.find(l => l.every(i => b[i] === p)) || null
}

function settle() {
  for (const p of ['X', 'O']) {
    const line = findWin(board.value, p)
    if (line) {
      winner.value = p
      winLine.value = line
      score.value[p === 'X' ? 'x' : 'o']++
      return true
    }
  }
  if (board.value.every(Boolean)) { score.value.d++; return true }
  return false
}

function play(i) {
  if (board.value[i] || winner.value || turn.value !== 'X') return
  board.value[i] = 'X'
  if (settle()) return
  turn.value = 'O'
  setTimeout(computerMove, 420)
}

// Simple but competent AI: win > block > center > corner > random
function bestMove() {
  const b = board.value
  const empty = b.map((c, i) => c ? null : i).filter(i => i !== null)
  for (const i of empty) { const t = [...b]; t[i] = 'O'; if (findWin(t, 'O')) return i }
  for (const i of empty) { const t = [...b]; t[i] = 'X'; if (findWin(t, 'X')) return i }
  if (empty.includes(4)) return 4
  const corners = [0, 2, 6, 8].filter(i => empty.includes(i))
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)]
  return empty[Math.floor(Math.random() * empty.length)]
}

function computerMove() {
  if (winner.value) return
  const i = bestMove()
  if (i === undefined) return
  board.value[i] = 'O'
  if (settle()) return
  turn.value = 'X'
}

function reset() {
  board.value = Array(9).fill(null)
  winner.value = null
  winLine.value = []
  turn.value = 'X'
}
</script>

<style lang="scss" scoped>
.ttt { display: flex; flex-direction: column; align-items: center; gap: var(--space-5); padding: var(--space-1) 0 var(--space-2); }

// ── Status pill ─────────────────────────────────────────────────────
.ttt-status {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 13px; font-weight: 600;
  background: var(--bg-200);
  border: 1px solid var(--line);
  color: var(--ink-muted);
  transition: color 120ms, border-color 120ms;
  .ttt-dot { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--ink-faint); flex: none; }
}
.ttt-status--you  { color: var(--peach-text); border-color: var(--peach);
  .ttt-dot { background: var(--peach); animation: pulse 1.4s infinite; } }
.ttt-status--wait { color: var(--ink-muted);
  .ttt-dot { background: var(--ink-faint); animation: pulse 0.8s infinite; } }
.ttt-status--win  { color: var(--success-text); border-color: var(--success);
  .ttt-dot { background: var(--success); } }
.ttt-status--lose { color: var(--violet-text); border-color: var(--violet);
  .ttt-dot { background: var(--violet); } }
.ttt-status--draw { color: var(--ink-muted);
  .ttt-dot { background: var(--ink-faint); } }

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

// ── Board ───────────────────────────────────────────────────────────
.ttt-board {
  display: grid;
  grid-template-columns: repeat(3, 104px);
  grid-template-rows: repeat(3, 104px);
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-000);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 44px color-mix(in srgb, var(--peach) 12%, transparent);
  transition: box-shadow 200ms;
  &.done { box-shadow: 0 0 56px color-mix(in srgb, var(--peach) 24%, transparent); }
}

.ttt-cell {
  position: relative;
  background: var(--bg-100);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: background-color 120ms, border-color 120ms, box-shadow 120ms;
  &:hover:not(:disabled) {
    background: var(--bg-200);
    border-color: var(--peach);
    box-shadow: inset 0 0 22px color-mix(in srgb, var(--peach) 12%, transparent);
    .ghost { opacity: 0.5; }
  }
  &:disabled { cursor: default; }
  &.win {
    border-color: var(--peach);
    background: var(--peach-soft);
    box-shadow: 0 0 24px color-mix(in srgb, var(--peach) 45%, transparent);
    animation: winpulse 1.1s ease infinite;
  }
}
@keyframes winpulse {
  0%,100% { box-shadow: 0 0 24px color-mix(in srgb, var(--peach) 40%, transparent); }
  50%     { box-shadow: 0 0 34px color-mix(in srgb, var(--peach) 70%, transparent); }
}

.mark { font-size: 56px; font-weight: 800; line-height: 1; animation: pop 0.18s ease; }
.mark--x { color: var(--peach); text-shadow: 0 0 18px color-mix(in srgb, var(--peach) 70%, transparent); }
.mark--o { color: var(--violet-text); text-shadow: 0 0 18px color-mix(in srgb, var(--violet) 65%, transparent); }

.ghost {
  position: absolute;
  font-size: 48px; font-weight: 800; line-height: 1;
  color: var(--peach);
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms;
}

@keyframes pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }

// ── Footer ──────────────────────────────────────────────────────────
.ttt-footer { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); width: 100%; }
.ttt-score { display: flex; gap: var(--space-2); }
.sc {
  display: inline-flex; align-items: center; gap: 6px;
  padding: var(--space-1) var(--space-3);
  background: var(--bg-200);
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  font-size: 12px; font-weight: 500; color: var(--ink-muted);
  b { font-size: 14px; color: var(--ink); }
}
.sc--x { border-color: var(--peach); b { color: var(--peach-text); } }
.sc--o { border-color: var(--violet); b { color: var(--violet-text); } }
</style>
