<template>
  <nav class="navbar">
    <div class="nav-logo">
      <div class="logo-icon">⚡</div>
      <span class="logo-name">DevShop</span>
    </div>
    <slot name="center" />
    <div class="nav-right">
      <slot name="right" />
      <router-link to="/feedback" class="nav-feedback" title="Feedback">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </router-link>
      <ThemeSelector />
      <span v-if="showUsername" class="nav-username">{{ user?.name || user?.email }}</span>
      <div class="nav-avatar">{{ initials }}</div>
      <button class="nav-logout" @click="logout" title="Logout">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'

defineProps({
  showUsername: { type: Boolean, default: true }
})

const store = useStore()
const router = useRouter()
const user = computed(() => store.getters['auth/currentUser'])
const initials = computed(() => store.getters['auth/userInitials'])

async function logout() {
  await store.dispatch('auth/logout')
  router.push('/')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.navbar {
  height: 58px;
  background: $bg-surface;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  padding: 0 28px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 20px rgba(0,0,0,0.3);
  flex-shrink: 0;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
}

.logo-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  box-shadow: 0 2px 10px var(--accent-glow);
}

.logo-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-heading);
  letter-spacing: -0.3px;
  line-height: 1;
  align-self: center;
  position: relative;
  top: 1px; // nudge down 1px to optically center with the icon
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-username {
  font-size: 13px;
  font-weight: 500;
  color: $brand-300;
}

.nav-avatar {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, $brand-600, $brand-500);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.nav-feedback {
  width: 32px; height: 32px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: $brand-400;
  transition: all 0.2s;
  text-decoration: none;
  &:hover { border-color: var(--accent); color: var(--accent); }
  &.router-link-active { border-color: $brand-500; color: var(--accent); background: var(--accent-subtle); }
}

.nav-logout {
  width: 32px; height: 32px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: $brand-400;
  font-size: 14px;
  transition: all 0.2s;
  &:hover { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.3); color: #f87171; }
}
</style>
