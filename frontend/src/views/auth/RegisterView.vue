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
        <div class="text-h6 font-weight-medium mb-6">Create account</div>

        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Name"
            :error-messages="errors.name"
            autocomplete="name"
            class="mb-1"
          />

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
            autocomplete="new-password"
            class="mb-1"
          />

          <v-text-field
            v-model="form.confirmPassword"
            label="Confirm password"
            type="password"
            :error-messages="errors.confirmPassword"
            autocomplete="new-password"
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
            Create account
          </v-btn>
        </v-form>

        <div class="text-center text-body-2 mt-6" style="color: #c8c4be">
          Already have an account?
          <router-link to="/login" style="color: #cc1f1f">Sign in</router-link>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const serverError = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function validate(): boolean {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  let valid = true

  if (!form.name) {
    errors.name = 'Name is required'
    valid = false
  }

  if (!form.email) {
    errors.email = 'Email is required'
    valid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    valid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    valid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  serverError.value = ''
  loading.value = true

  try {
    await authApi.register({ name: form.name, email: form.email, password: form.password })
    const { data } = await authApi.login({ email: form.email, password: form.password })
    authStore.setSession(data)
    router.push('/')
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      errors.email = 'This email address is already in use'
    } else {
      serverError.value = 'Something went wrong, try again'
    }
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
