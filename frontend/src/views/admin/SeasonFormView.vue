<template>
  <div style="max-width: 540px">
    <div class="d-flex align-center gap-2 mb-6">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        size="small"
        color="onSurface"
        :to="{ name: 'AdminSeasons' }"
      />
      <h1 class="text-h5 font-weight-medium">{{ isEdit ? 'Edit season' : 'New season' }}</h1>
    </div>

    <v-card style="background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 8px">
      <v-card-text class="pa-6">
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Season name"
            :error-messages="errors.name"
            placeholder="e.g. Season 26 – Peru"
            class="mb-1"
          />

          <v-text-field
            v-model.number="form.year"
            label="Year"
            type="number"
            :error-messages="errors.year"
            class="mb-1"
          />

          <v-checkbox
            v-model="form.isActive"
            label="Set as active season"
            color="primary"
            class="mb-2"
          />

          <div v-if="serverError" class="text-body-2 mb-4" style="color: #e84040">
            {{ serverError }}
          </div>

          <div class="d-flex gap-2 justify-end">
            <v-btn variant="text" color="onSurface" :to="{ name: 'AdminSeasons' }">Cancel</v-btn>
            <v-btn type="submit" color="primary" :loading="loading">
              {{ isEdit ? 'Save changes' : 'Create season' }}
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSeasonStore } from '@/stores/seasonStore'

const route = useRoute()
const router = useRouter()
const store = useSeasonStore()

const isEdit = !!route.params.id
const loading = ref(false)
const serverError = ref('')

const form = reactive({
  name: '',
  year: new Date().getFullYear(),
  isActive: false,
})

const errors = reactive({
  name: '',
  year: '',
})

onMounted(async () => {
  if (!isEdit) return
  try {
    const { data } = await (await import('@/api/seasons')).seasonsApi.get(route.params.id as string)
    form.name = data.name
    form.year = data.year
    form.isActive = data.isActive
  } catch {
    serverError.value = 'Could not load season.'
  }
})

function validate(): boolean {
  errors.name = ''
  errors.year = ''
  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Season name is required'
    valid = false
  }

  const y = Number(form.year)
  if (!form.year || y < 2000 || y > 2099) {
    errors.year = 'Year must be between 2000 and 2099'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  serverError.value = ''

  try {
    const payload = { name: form.name.trim(), year: Number(form.year), isActive: form.isActive }

    if (isEdit) {
      await store.updateSeason(route.params.id as string, payload)
      router.push({ name: 'AdminSeasons' })
    } else {
      const season = await store.createSeason(payload)
      router.push({ name: 'AdminSeasonCandidates', params: { id: season.id } })
    }
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    serverError.value = msg ?? 'Something went wrong, try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
