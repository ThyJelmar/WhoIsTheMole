import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

export const routes: RouteRecordRaw[] = [
  // Public
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
  },

  // Authenticated
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/user/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/episodes/:id/entry',
    name: 'EpisodeEntry',
    component: () => import('@/views/user/EpisodeEntryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/candidates/:id',
    name: 'CandidateDetail',
    component: () => import('@/views/user/CandidateDetailView.vue'),
    meta: { requiresAuth: true },
  },

  // Admin
  {
    path: '/admin/seasons',
    name: 'AdminSeasons',
    component: () => import('@/views/admin/SeasonManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/seasons/new',
    name: 'AdminSeasonCreate',
    component: () => import('@/views/admin/SeasonFormView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/seasons/:id/edit',
    name: 'AdminSeasonEdit',
    component: () => import('@/views/admin/SeasonFormView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/seasons/:id/candidates',
    name: 'AdminSeasonCandidates',
    component: () => import('@/views/admin/CandidateManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/candidates',
    name: 'AdminCandidates',
    component: () => import('@/views/admin/CandidateManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/UserManagementView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // Catch-all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export function createAppRouter() {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  })

  router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // Await session restore on first navigation (or after logout resets isReady)
    if (!authStore.isReady) {
      await authStore.fetchMe()
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return next({ name: 'Dashboard' })
    }

    next()
  })

  return router
}

export default createAppRouter()
