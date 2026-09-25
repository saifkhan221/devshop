<template>
  <div class="shell" :class="{ 'shell--collapsed': collapsed }">
    <!-- ── Sidebar ─────────────────────────────────────────────── -->
    <nav class="ds-sidebar shell-sidebar" :class="{ 'ds-sidebar-collapsed': collapsed }" aria-label="Main">
      <router-link to="/dashboard" class="ds-sidebar-brand" title="Dashboard">
        <span class="ds-sidebar-mark brand-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h8l-1 8 10-12h-8z"/></svg>
        </span>
        <span>Dev Kit</span>
      </router-link>

      <div class="ds-nav-group">Workspace</div>
      <router-link to="/dashboard" class="ds-nav-item" :aria-current="isActive('/dashboard')" title="Dashboard">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/library" class="ds-nav-item" :aria-current="isActive('/library')" title="Library">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>Library</span>
      </router-link>
      <router-link to="/feedback" class="ds-nav-item" :aria-current="isActive('/feedback')" title="Feedback">
        <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>
        <span>Feedback</span>
      </router-link>

      <template v-if="isAdmin">
        <div class="ds-nav-group">Admin</div>
        <router-link to="/admin" class="ds-nav-item" :aria-current="isActive('/admin')" title="Dev log">
          <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>Dev log</span>
        </router-link>
      </template>

      <div class="shell-sidebar-tail">
        <ThemeSelector class="shell-theme" />
        <div class="ds-sidebar-footer">
          <span class="ds-avatar ds-avatar-sm ds-avatar-peach">{{ initials }}</span>
          <span class="shell-user">
            <span class="shell-user-name">{{ user?.name || firstName }}</span>
            <span class="shell-user-mail">{{ user?.email }}</span>
          </span>
          <button class="ds-icon-btn ds-icon-btn-sm shell-logout" @click="logout" title="Log out" aria-label="Log out">
            <svg class="ds-icon ds-icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- ── Main column ─────────────────────────────────────────── -->
    <div class="shell-main">
      <header class="ds-topbar shell-topbar">
        <button class="ds-icon-btn shell-collapse" @click="collapsed = !collapsed" :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <svg class="ds-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>
        </button>
        <nav class="ds-crumbs" aria-label="Breadcrumb">
          <slot name="crumbs"><span class="is-current">{{ title }}</span></slot>
        </nav>
        <div class="ds-topbar-search"><slot name="search" /></div>
        <div class="ds-topbar-actions"><slot name="actions" /></div>
      </header>

      <main class="shell-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'

defineProps({
  title: { type: String, default: '' },
})

const store  = useStore()
const route  = useRoute()
const router = useRouter()

const user     = computed(() => store.getters['auth/currentUser'])
const initials = computed(() => store.getters['auth/userInitials'])
const isAdmin  = computed(() => user.value?.email === 'saif@radix.email')
const firstName = computed(() => (user.value?.displayName || user.value?.email || 'You').split('@')[0].split(' ')[0])

function isActive(path) { return route.path.startsWith(path) ? 'page' : null }

// Sidebar collapse: remembered per browser
const KEY = 'devshop_sidebar_collapsed'
const collapsed = ref(localStorage.getItem(KEY) === '1')
watch(collapsed, v => localStorage.setItem(KEY, v ? '1' : '0'))

async function logout() {
  await store.dispatch('auth/logout')
  router.push('/')
}
</script>

<style lang="scss" scoped>
.shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  min-height: 100vh;
  background: var(--bg-000);
  transition: grid-template-columns 200ms cubic-bezier(.2,.8,.2,1);
  &--collapsed { grid-template-columns: var(--space-16) 1fr; }
}

.shell-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: visible;   // the theme panel pops out to the right
  transition: width 200ms cubic-bezier(.2,.8,.2,1);
}
.ds-sidebar-collapsed .ds-sidebar-brand .brand-mark { display: inline-grid; }
.ds-sidebar-brand { text-decoration: none; color: var(--ink); }
.brand-mark {
  display: inline-grid; place-items: center;
  svg { width: 16px; height: 16px; fill: var(--on-peach); }
}
.ds-nav-item { text-decoration: none; }

.shell-sidebar-tail { margin-top: auto; display: flex; flex-direction: column; gap: var(--space-2); }
.shell-theme { padding: 0 var(--space-1); }
.ds-sidebar-collapsed .shell-theme { display: none; }
.shell-user { display: flex; flex-direction: column; min-width: 0; line-height: 16px; }
.shell-user-name { font-size: 13px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shell-user-mail { font-size: 11px; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.shell-logout { margin-left: auto; flex: none; }
.ds-sidebar-collapsed .shell-user, .ds-sidebar-collapsed .shell-logout { display: none; }
.ds-sidebar-collapsed .ds-sidebar-footer { justify-content: center; }

.shell-main { min-width: 0; display: flex; flex-direction: column; }
.shell-topbar { position: sticky; top: 0; z-index: var(--z-sticky); }
.shell-collapse { margin-left: calc(var(--space-2) * -1); }
.shell-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-8);
}

@media (max-width: 1023px) {
  .shell { grid-template-columns: var(--space-16) 1fr; }
  .shell-content { padding: var(--space-5) var(--space-4); }
}
</style>
