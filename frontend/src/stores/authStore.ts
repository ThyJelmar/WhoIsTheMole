import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api/auth'

export type UserRole = 'User' | 'Administrator'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(null)
  const name = ref<string | null>(null)
  const email = ref<string | null>(null)
  const role = ref<UserRole | null>(null)
  const isAuthenticated = ref(false)

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
      clearSession()
    }
  }

  function setSession(data: { userId: string; name: string; email: string; role: UserRole }) {
    userId.value = data.userId
    name.value = data.name
    email.value = data.email
    role.value = data.role
    isAuthenticated.value = true
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
    }
  }

  return {
    userId,
    name,
    email,
    role,
    isAuthenticated,
    isAdmin,
    fetchMe,
    setSession,
    clearSession,
    logout,
  }
})
