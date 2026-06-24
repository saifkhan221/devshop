import { createRouter, createWebHistory } from 'vue-router'
import { store } from '@/store'

const routes = [
  { path: '/', name: 'auth', component: () => import('@/views/AuthView.vue'), meta: { guestOnly: true } },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/project/:id/setup', name: 'tool-selector', component: () => import('@/views/ToolSelectorView.vue'), meta: { requiresAuth: true } },
  { path: '/project/:id', name: 'project-board', component: () => import('@/views/ProjectBoardView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters['auth/isLoggedIn']
  if (to.meta.requiresAuth && !isLoggedIn) return next('/')
  if (to.meta.guestOnly && isLoggedIn) return next('/dashboard')
  next()
})

export default router
