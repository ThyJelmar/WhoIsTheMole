<template>
  <div class="auth-container">
    <div class="text-h5 font-weight-medium text-center mb-6" style="color: #f0ede8">
      Who Is The Mole
    </div>

    <v-card
      max-width="420"
      width="100%"
      style="background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 8px"
    >
      <v-card-text class="pa-8">
        <div class="text-h6 font-weight-medium mb-6">Sign in</div>

        <v-form @submit.prevent="handleSubmit" @keydown.enter="handleSubmit">
          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            :error-messages="errors.email"
            autocomplete="email"
            class="mb-1"
          />

          <v-text-field
            v-model="form.password"
            label="Password"
            type="password"
            :error-messages="errors.password"
            autocomplete="current-password"
            class="mb-1"
          />

          <div v-if="serverError" class="text-body-2 mb-4" style="color: #e84040">
            {{ serverError }}
          </div>

          <v-btn
            type="submit"
            color="primary"
            block
            :loading="loading"
            :disabled="loading"
            class="mt-2"
          >
            Sign in
          </v-btn>
        </v-form>

        <div class="text-center text-body-2 mt-6" style="color: #c8c4be">
          No account yet?
          <router-link to="/register" style="color: #cc1f1f">Create one</router-link>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const serverError = ref('')

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive({
  email: '',
  password: '',
})

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!form.email) {
    errors.email = 'Email is required'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  serverError.value = ''
  loading.value = true

  try {
    const { data } = await authApi.login({ email: form.email, password: form.password })
    authStore.setSession(data)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? '/')
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    serverError.value =
      status === 401 ? 'Incorrect email or password' : 'Something went wrong, try again'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #0d0d0d;
}
</style>
