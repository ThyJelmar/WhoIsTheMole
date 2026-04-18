import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'
import { markRefreshFailed, resetRefreshFailed } from '@/api/axios'

export type UserRole = 'User' | 'Administrator'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(null)
  const name = ref<string | null>(null)
  const email = ref<string | null>(null)
  const role = ref<UserRole | null>(null)
  const isAuthenticated = ref(false)
  const isReady = ref(false)

  const isAdmin = computed(() => role.value === 'Administrator')

  async function fetchMe() {
    try {
      const { data } = await authApi.me()
      userId.value = data.userId
      name.value = data.name
      email.value = data.email
      role.value = data.role
      isAuthenticated.value = true
    } catch {
      // No valid session — expected on first visit or after expiry
      isAuthenticated.value = false
    } finally {
      isReady.value = true
    }
  }

  function setSession(data: { userId: string; name: string; email: string; role: UserRole }) {
    userId.value = data.userId
    name.value = data.name
    email.value = data.email
    role.value = data.role
    isAuthenticated.value = true
    isReady.value = true
    resetRefreshFailed()
  }

  function clearSession() {
    userId.value = null
    name.value = null
    email.value = null
    role.value = null
    isAuthenticated.value = false
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      isReady.value = false
      markRefreshFailed()
    }
  }

  return {
    userId,
    name,
    email,
    role,
    isAuthenticated,
    isAdmin,
    isReady,
    fetchMe,
    setSession,
    clearSession,
    logout,
  }
})
