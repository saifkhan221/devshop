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
      <button class="ttt-reset" @click="reset">New round</button>
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
@use '@/styles/variables' as *;

.ttt { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 6px 0 10px; }

// ── Status pill ─────────────────────────────────────────────────────
.ttt-status {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 13.5px; font-weight: 600;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s;
  .ttt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
}
.ttt-status--you  { color: #22d3ee; border-color: rgba(34,211,238,.35);
  .ttt-dot { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; animation: pulse 1.4s infinite; } }
.ttt-status--wait { color: $brand-300;
  .ttt-dot { background: $brand-400; animation: pulse 0.8s infinite; } }
.ttt-status--win  { color: #22d3ee; border-color: rgba(34,211,238,.5); background: rgba(34,211,238,.08);
  .ttt-dot { background: #22d3ee; box-shadow: 0 0 10px #22d3ee; } }
.ttt-status--lose { color: #f472b6; border-color: rgba(244,114,182,.4);
  .ttt-dot { background: #f472b6; box-shadow: 0 0 8px #f472b6; } }
.ttt-status--draw { color: $brand-300;
  .ttt-dot { background: $brand-400; } }

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }

// ── Board ───────────────────────────────────────────────────────────
.ttt-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 88px);
  grid-template-rows: repeat(3, 88px);
  gap: 12px;
  padding: 18px;
  background:
    radial-gradient(circle at 50% 0%, rgba(34,211,238,.06), transparent 60%),
    radial-gradient(circle at 50% 100%, rgba(244,114,182,.05), transparent 60%),
    #0b0b16;
  border: 1px solid rgba(124,58,237,.28);
  border-radius: 20px;
  box-shadow:
    inset 0 0 50px rgba(124,58,237,.14),
    0 0 40px rgba(124,58,237,.12);
  &.done { box-shadow: inset 0 0 50px rgba(34,211,238,.18), 0 0 50px rgba(34,211,238,.15); }
}

.ttt-cell {
  position: relative;
  background: linear-gradient(160deg, #14142400, #12121f);
  border: 1px solid rgba(124,58,237,.22);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.18s;
  &:hover:not(:disabled) {
    border-color: rgba(34,211,238,.6);
    box-shadow: inset 0 0 20px rgba(34,211,238,.12), 0 0 18px rgba(34,211,238,.2);
    .ghost { opacity: 0.22; transform: scale(1); }
  }
  &:disabled { cursor: default; }
  &.win {
    border-color: rgba(34,211,238,.95);
    box-shadow: inset 0 0 26px rgba(34,211,238,.25), 0 0 26px rgba(34,211,238,.55);
    animation: winpulse 1s ease infinite;
  }
}
@keyframes winpulse {
  0%,100% { box-shadow: inset 0 0 26px rgba(34,211,238,.25), 0 0 26px rgba(34,211,238,.55); }
  50%     { box-shadow: inset 0 0 30px rgba(34,211,238,.4),  0 0 38px rgba(34,211,238,.8); }
}

.mark { font-size: 48px; font-weight: 700; line-height: 1; animation: pop 0.2s ease; }
.mark--x { color: #22d3ee; text-shadow: 0 0 10px rgba(34,211,238,.9), 0 0 24px rgba(34,211,238,.6); }
.mark--o { color: #f472b6; text-shadow: 0 0 10px rgba(244,114,182,.9), 0 0 24px rgba(244,114,182,.55); }

.ghost {
  position: absolute;
  font-size: 44px; font-weight: 700; line-height: 1;
  color: #22d3ee;
  opacity: 0; transform: scale(0.7);
  pointer-events: none;
  transition: all 0.18s;
}

@keyframes pop { from { transform: scale(0.35); opacity: 0; } to { transform: scale(1); opacity: 1; } }

// ── Footer ──────────────────────────────────────────────────────────
.ttt-footer { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; }
.ttt-score { display: flex; gap: 10px; }
.sc {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  background: rgba(255,255,255,.03);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-size: 11.5px; font-weight: 500; color: $brand-400;
  b { font-size: 14px; }
}
.sc--x { border-color: rgba(34,211,238,.25); b { color: #22d3ee; } }
.sc--o { border-color: rgba(244,114,182,.25); b { color: #f472b6; } }
.sc--d b { color: #fff; }

.ttt-reset {
  padding: 10px 24px;
  background: linear-gradient(135deg, rgba(34,211,238,.15), rgba(124,58,237,.2));
  border: 1px solid $brand-500;
  border-radius: $radius-md;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  &:hover { border-color: #22d3ee; box-shadow: 0 0 20px rgba(34,211,238,.3); transform: translateY(-1px); }
}
</style>
