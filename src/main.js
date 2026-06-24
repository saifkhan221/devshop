import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './styles/main.scss'
import { initTheme } from '@/utils/theme'

const app = createApp(App)
app.use(store)

initTheme() // apply saved theme before mount — prevents flash of default theme

// ── Auth-first boot ────────────────────────────────────────────────────────
// Router is installed AFTER initAuth resolves so the beforeEach guard
// sees the correct isLoggedIn state on the very first navigation.
// If router is installed before auth is known, the guard fires with
// isLoggedIn=false and redirects the user to "/" on every page refresh.
store.dispatch('auth/initAuth').then(() => {
  app.use(router)
  app.mount('#app')

  // Fade out and remove the native boot screen
  const boot = document.getElementById('app-boot')
  if (boot) {
    boot.classList.add('fade-out')
    setTimeout(() => boot.remove(), 350)
  }
})
