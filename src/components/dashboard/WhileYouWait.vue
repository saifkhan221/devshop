<template>
  <div>
    <!-- Banner -->
    <button class="ds-card ds-card-link wyw-banner" @click="open = true">
      <span class="wyw-art" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>
      </span>
      <span class="wyw-copy">
        <span class="wyw-title">Waiting on your AI agent to finish coding?</span>
        <span class="wyw-sub">Catch up on the news or play a quick game while it works.</span>
      </span>
      <span class="ds-btn wyw-cta">
        Take a break
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </span>
    </button>

    <!-- Modal -->
    <teleport to="body">
      <transition name="wyw-fade">
        <div v-if="open" class="wyw-overlay" @click.self="open = false">
          <div class="wyw-dialog">
            <div class="wyw-head">
              <div class="wyw-tabs">
                <button :class="{ active: tab === 'news' }" @click="tab = 'news'">News</button>
                <button :class="{ active: tab === 'ttt' }" @click="tab = 'ttt'">Tic-Tac-Toe</button>
                <button :class="{ active: tab === 'sudoku' }" @click="tab = 'sudoku'">Sudoku</button>
                <button :class="{ active: tab === '2048' }" @click="tab = '2048'">2048</button>
              </div>
              <button class="ds-icon-btn ds-icon-btn-sm wyw-close" @click="open = false" aria-label="Close">
                <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
              </button>
            </div>

            <div class="wyw-content">
              <NewsPanel v-if="tab === 'news'" />
              <TicTacToe v-else-if="tab === 'ttt'" />
              <Sudoku v-else-if="tab === 'sudoku'" />
              <Game2048 v-else-if="tab === '2048'" />
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'

const NewsPanel = defineAsyncComponent(() => import('./NewsPanel.vue'))
const TicTacToe = defineAsyncComponent(() => import('@/components/games/TicTacToe.vue'))
const Sudoku    = defineAsyncComponent(() => import('@/components/games/Sudoku.vue'))
const Game2048  = defineAsyncComponent(() => import('@/components/games/Game2048.vue'))

const open = ref(false)
const tab = ref('news')
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

// ── Banner ──────────────────────────────────────────────────────────
.wyw-banner {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font: inherit;
  color: var(--ink);
  &:hover .wyw-cta svg { transform: translateX(3px); }
}
.wyw-art {
  width: 56px; height: 56px; flex: none;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--gradient-peach-start), var(--gradient-peach-end));
  display: grid; place-items: center;
  svg { width: 24px; height: 24px; stroke: var(--on-peach); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
}
.wyw-copy { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.wyw-title { font-size: 14px; font-weight: 700; color: var(--ink); }
.wyw-sub { font-size: 13px; line-height: 20px; color: var(--ink-muted); }
.wyw-cta { flex-shrink: 0; svg { transition: transform 120ms; } }

// ── Modal ───────────────────────────────────────────────────────────
.wyw-overlay {
  position: fixed; inset: 0;
  background: var(--overlay);
  backdrop-filter: blur(5px);
  z-index: 130;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 48px 20px;
  overflow-y: auto;
}
.wyw-dialog {
  background: var(--bg-100);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-overlay);
  width: 100%;
  max-width: 560px;
  overflow: hidden;
}

.wyw-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--line);
}
.wyw-tabs {
  display: flex; gap: 2px; flex-wrap: wrap;
  background: var(--bg-200);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 3px;
  button {
    padding: 7px 14px;
    background: transparent; border: 0; border-radius: 6px;
    font: inherit; font-size: 13px; font-weight: 600;
    color: var(--ink-muted); cursor: pointer;
    transition: background-color 120ms, color 120ms;
    &:hover { color: var(--ink); }
    &.active { background: var(--peach-soft); color: var(--peach-text); }
  }
}
.wyw-close { flex: none; }

.wyw-content { padding: var(--space-5) var(--space-6) var(--space-6); }

.wyw-fade-enter-active, .wyw-fade-leave-active { transition: opacity 0.2s ease; }
.wyw-fade-enter-from, .wyw-fade-leave-to { opacity: 0; }

@media (max-width: 560px) {
  .wyw-banner { flex-direction: column; align-items: flex-start; gap: 10px; }
  .wyw-cta { align-self: stretch; justify-content: center; }
}
</style>
