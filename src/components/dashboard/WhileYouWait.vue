<template>
  <div>
    <!-- Banner -->
    <button class="wyw-banner" @click="open = true">
      <span class="wyw-emoji">☕</span>
      <span class="wyw-copy">
        <span class="wyw-title">Waiting on your AI agent to finish coding?</span>
        <span class="wyw-sub">Catch up on the news or play a quick game while it works.</span>
      </span>
      <span class="wyw-cta">
        Take a break
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </span>
    </button>

    <!-- Modal -->
    <teleport to="body">
      <transition name="wyw-fade">
        <div v-if="open" class="wyw-overlay" @click.self="open = false">
          <div class="wyw-dialog">
            <div class="wyw-head">
              <div class="wyw-tabs">
                <button :class="{ active: tab === 'news' }" @click="tab = 'news'">📰 News</button>
                <button :class="{ active: tab === 'game' }" @click="tab = 'game'">🎮 Tic-Tac-Toe</button>
              </div>
              <button class="wyw-close" @click="open = false">✕</button>
            </div>

            <div class="wyw-content">
              <NewsPanel v-if="tab === 'news'" />
              <TicTacToe v-else />
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
  gap: 16px;
  padding: 14px 20px;
  background: linear-gradient(100deg, var(--accent-subtle), rgba(34,211,238,.06));
  border: 1px solid rgba(124,58,237,.28);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  &:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(124,58,237,.18);
    .wyw-cta svg { transform: translateX(3px); }
  }
}

.wyw-emoji {
  font-size: 24px; flex-shrink: 0;
  filter: drop-shadow(0 0 8px rgba(124,58,237,.4));
}
.wyw-copy { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.wyw-title { font-size: 14px; font-weight: 600; color: $text-heading; }
.wyw-sub { font-size: 12.5px; color: $brand-400; }

.wyw-cta {
  display: flex; align-items: center; gap: 7px; flex-shrink: 0;
  padding: 8px 16px;
  background: rgba(124,58,237,.16);
  border: 1px solid $brand-500;
  border-radius: $radius-md;
  color: var(--accent);
  font-size: 13px; font-weight: 600;
  white-space: nowrap;
  svg { transition: transform 0.2s; }
}

// ── Modal ───────────────────────────────────────────────────────────
.wyw-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(5px);
  z-index: 130;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 48px 20px;
  overflow-y: auto;
}
.wyw-dialog {
  background: $bg-surface;
  border: 1px solid var(--border-strong);
  border-radius: 18px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 24px 70px rgba(0,0,0,.5);
  overflow: hidden;
}

.wyw-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}
.wyw-tabs {
  display: flex; gap: 4px;
  background: $bg-elevated;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 4px;
  button {
    padding: 7px 14px;
    background: transparent; border: none; border-radius: 7px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 500;
    color: $brand-400; cursor: pointer;
    transition: all 0.15s;
    &.active { background: $brand-600; color: #fff; }
  }
}
.wyw-close {
  width: 32px; height: 32px; flex-shrink: 0;
  background: $bg-elevated; border: none; border-radius: 8px;
  color: $brand-300; font-size: 15px; cursor: pointer;
  transition: all 0.15s;
  &:hover { background: $brand-700; color: #fff; }
}

.wyw-content { padding: 20px 22px 24px; }

.wyw-fade-enter-active, .wyw-fade-leave-active { transition: opacity 0.2s ease; }
.wyw-fade-enter-from, .wyw-fade-leave-to { opacity: 0; }

@media (max-width: 560px) {
  .wyw-banner { flex-direction: column; align-items: flex-start; gap: 10px; }
  .wyw-cta { align-self: stretch; justify-content: center; }
}
</style>
