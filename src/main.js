import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './styles/main.scss'
import { initTheme } from '@/utils/theme'

const app = createApp(App)
app.use(store)
app.use(router)

initTheme() // apply saved theme before mount — prevents flash of default theme

store.dispatch('auth/initAuth').then(() => {
  app.mount('#app')
})
