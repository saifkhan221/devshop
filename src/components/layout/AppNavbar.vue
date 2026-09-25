<template>
  <nav class="navbar">
    <router-link to="/dashboard" class="nav-logo" title="Go to dashboard">
      <div class="logo-icon">⚡</div>
      <span class="logo-name">Dev Kit</span>
    </router-link>
    <slot name="center" />
    <div class="nav-right">
      <slot name="right" />
      <router-link v-if="user?.email === 'saif@radix.email'" to="/admin" class="nav-admin" title="Dev Log">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </router-link>
      <router-link to="/library" class="nav-feedback nav-library" title="Library">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      </router-link>
      <router-link to="/feedback" class="nav-feedback" title="Feedback">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/><path d="M21 3l-4 4"/><path d="M18 2l3 3"/></svg>
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
  background: var(--bg-100);              // ds bg-100 (step 1)
  border-bottom: 1px solid var(--line);   // ds line (step 1)
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
  flex: 0 0 auto;
  margin-right: auto;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.82; }
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
  color: var(--ink);   // ds ink (step 1)
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
  color: var(--ink-muted);   // ds ink-muted (step 1)
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

.nav-admin {
  width: 32px; height: 32px;
  background: transparent;
  border: 1px solid var(--line);          // ds line (step 1)
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--ink-muted);                // ds ink-muted (step 1)
  transition: all 0.2s;
  text-decoration: none;
  // admin is a distinct role signal, kept on warning (not the peach primary)
  &:hover { border-color: var(--warning); color: var(--warning-text); }
  &.router-link-active { border-color: var(--warning); color: var(--warning-text); background: var(--warning-soft); }
}

.nav-feedback {
  width: 32px; height: 32px;
  background: transparent;
  border: 1px solid var(--line);          // ds line (step 1)
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--ink-muted);                // ds ink-muted (step 1)
  transition: all 0.2s;
  text-decoration: none;
  // "you are here" / hover signal -> peach (step 2)
  &:hover { border-color: var(--peach); color: var(--peach-text); }
  &.router-link-active { border-color: var(--peach); color: var(--peach-text); background: var(--peach-soft); }
}

.nav-logout {
  width: 32px; height: 32px;
  background: transparent;
  border: 1px solid var(--line);          // ds line (step 1)
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: var(--ink-muted);                // ds ink-muted (step 1)
  font-size: 14px;
  transition: all 0.2s;
  // destructive action keeps danger tones
  &:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger-text); }
}
</style>
