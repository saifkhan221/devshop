<template>
  <div class="lb">
    <div class="lb-head">
      <div class="ds-segmented" role="group" aria-label="Game">
        <button v-for="g in GAMES" :key="g.key" type="button" class="ds-seg-item" :aria-pressed="game === g.key" @click="game = g.key">{{ g.label }}</button>
      </div>
      <div v-if="game === 'sudoku'" class="ds-segmented" role="group" aria-label="Difficulty">
        <button v-for="d in DIFFS" :key="d" type="button" class="ds-seg-item" :aria-pressed="sdiff === d" @click="sdiff = d">{{ cap(d) }}</button>
      </div>
    </div>

    <p v-if="loading" class="ds-muted lb-state">Loading…</p>

    <div v-else-if="ranked.length === 0" class="ds-empty">
      <div class="ds-empty-art">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4M6 5h12v6a6 6 0 0 1-12 0zM9 21h6M12 17v4"/></svg>
      </div>
      <div class="ds-empty-title">No scores yet</div>
      <p class="ds-empty-body">Play a round and you'll be the first on the board.</p>
    </div>

    <ol v-else class="lb-list">
      <li v-for="(r, i) in ranked" :key="r.id" class="lb-row" :class="{ me: r.id === myId }">
        <span class="lb-rank" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
        <span class="ds-avatar ds-avatar-sm" :class="i === 0 ? 'ds-avatar-peach' : (i === 1 ? 'ds-avatar-violet' : '')">{{ initial(r) }}</span>
        <span class="lb-name">
          {{ displayName(r) }}
          <span v-if="r.id === myId" class="ds-badge ds-badge-peach">You</span>
        </span>
        <span class="lb-metric">{{ metric(r) }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { dbService } from '@/services/db'

const store = useStore()
const user = computed(() => store.getters['auth/currentUser'])
const myId = computed(() => user.value?.uid || 'dummy-user')

const GAMES = [
  { key: 'ttt',    label: 'Tic-Tac-Toe' },
  { key: '2048',   label: '2048' },
  { key: 'sudoku', label: 'Sudoku' },
]
const DIFFS = ['easy', 'medium', 'hard']

const game = ref('ttt')
const sdiff = ref('easy')
const stats = ref([])
const loading = ref(true)

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
function displayName(r) {
  const n = (r.name || 'Player').split('@')[0]
  return r.id === myId.value ? n : n
}
function initial(r) { return (displayName(r)[0] || 'P').toUpperCase() }
function fmtTime(sec) {
  if (!sec && sec !== 0) return '—'
  const m = Math.floor(sec / 60), s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
const sudokuKey = computed(() => 'sudokuBest' + cap(sdiff.value))

const ranked = computed(() => {
  const list = [...stats.value]
  if (game.value === 'ttt') {
    return list
      .filter(r => (r.tttWins || r.tttLosses || r.tttDraws))
      .sort((a, b) => (b.tttWins || 0) - (a.tttWins || 0))
  }
  if (game.value === '2048') {
    return list.filter(r => r.best2048).sort((a, b) => (b.best2048 || 0) - (a.best2048 || 0))
  }
  // sudoku: fastest time for the selected difficulty
  const k = sudokuKey.value
  return list.filter(r => r[k]).sort((a, b) => a[k] - b[k])
})

function metric(r) {
  if (game.value === 'ttt') return `${r.tttWins || 0}W · ${r.tttLosses || 0}L · ${r.tttDraws || 0}D`
  if (game.value === '2048') return (r.best2048 || 0).toLocaleString()
  return fmtTime(r[sudokuKey.value])
}

async function load() {
  loading.value = true
  try {
    stats.value = await dbService.getGameStats((fresh) => { stats.value = fresh })
  } catch {
    stats.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.lb { display: flex; flex-direction: column; gap: var(--space-4); min-height: 300px; }
.lb-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
.lb-state { padding: var(--space-8) 0; text-align: center; }

.lb-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-1); }
.lb-row {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  &.me { background: var(--peach-soft); border-color: var(--peach); }
}
.lb-rank {
  width: 24px; flex: none; text-align: center;
  font-size: 13px; font-weight: 800; color: var(--ink-muted); font-variant-numeric: tabular-nums;
}
.lb-rank.rank-1 { color: var(--peach-text); }
.lb-rank.rank-2 { color: var(--violet-text); }
.lb-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: var(--space-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lb-metric { flex: none; font-size: 13px; font-weight: 600; color: var(--ink-muted); font-variant-numeric: tabular-nums; }
</style>
