<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-medium">Seasons</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :to="{ name: 'AdminSeasonCreate' }"
      >
        New season
      </v-btn>
    </div>

    <!-- Loading -->
    <template v-if="store.isLoading">
      <v-skeleton-loader v-for="i in 3" :key="i" type="list-item-two-line" class="mb-2" />
    </template>

    <!-- Empty state -->
    <div
      v-else-if="!store.isLoading && store.seasons.length === 0"
      class="text-center py-12 text-onSurface"
    >
      No seasons yet.
      <router-link :to="{ name: 'AdminSeasonCreate' }" style="color: #cc1f1f">
        Create your first season.
      </router-link>
    </div>

    <!-- Season list -->
    <template v-else>
      <div
        v-for="season in store.seasons"
        :key="season.id"
        class="season-row"
      >
        <!-- Active indicator -->
        <div class="d-flex align-center gap-2 mr-4" style="min-width: 90px">
          <span
            class="status-dot"
            :class="season.isActive ? 'status-dot--active' : 'status-dot--inactive'"
          />
          <span
            class="text-caption"
            :style="{ color: season.isActive ? '#4caf50' : '#666' }"
          >{{ season.isActive ? 'Active' : 'Inactive' }}</span>
        </div>

        <!-- Season info -->
        <div class="flex-grow-1">
          <div class="text-body-1 font-weight-medium">{{ season.name }}</div>
          <div class="text-caption text-onSurface">
            {{ season.year }} ·
            {{ season.candidateCount ?? 0 }} candidate{{ (season.candidateCount ?? 0) !== 1 ? 's' : '' }} ·
            {{ season.episodeCount ?? 0 }} episode{{ (season.episodeCount ?? 0) !== 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Actions -->
        <div class="d-flex align-center gap-1">
          <v-btn
            v-if="!season.isActive"
            size="small"
            variant="tonal"
            color="primary"
            :loading="activatingId === season.id"
            @click="handleSetActive(season.id)"
          >
            Set active
          </v-btn>

          <v-btn
            size="small"
            variant="text"
            icon="mdi-pencil-outline"
            color="onSurface"
            :to="{ name: 'AdminSeasonEdit', params: { id: season.id } }"
          />

          <v-btn
            size="small"
            variant="text"
            icon="mdi-trash-can-outline"
            :color="season.isActive ? 'onSurface' : 'error'"
            :disabled="season.isActive"
            @click="confirmDelete(season)"
          />
        </div>
      </div>
    </template>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card style="background: #1a1a1a; border: 1px solid #2e2e2e">
        <v-card-title class="text-body-1 font-weight-medium pa-6 pb-2">
          Delete season
        </v-card-title>
        <v-card-text class="pa-6 pt-2 text-body-2" style="color: #c8c4be">
          Are you sure you want to delete <strong style="color: #f0ede8">{{ deletingName }}</strong>?
          This cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 gap-2">
          <v-spacer />
          <v-btn variant="text" color="onSurface" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="tonal"
            :loading="deleting"
            @click="executeDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Error snackbar -->
    <v-snackbar v-model="snackbar" color="error" :timeout="4000" location="bottom">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import type { Season } from '@/api/seasons'
import { onMounted, ref } from 'vue'
import { useSeasonStore } from '@/stores/seasonStore'

const store = useSeasonStore()

const activatingId = ref<string | null>(null)
const deleteDialog = ref(false)
const deletingId = ref<string | null>(null)
const deletingName = ref('')
const deleting = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')

onMounted(() => store.fetchSeasons())

async function handleSetActive(id: string) {
  activatingId.value = id
  try {
    await store.setActiveSeason(id)
  } finally {
    activatingId.value = null
  }
}

function confirmDelete(season: Season) {
  deletingId.value = season.id
  deletingName.value = season.name
  deleteDialog.value = true
}

async function executeDelete() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await store.deleteSeason(deletingId.value)
    deleteDialog.value = false
  } catch (error: unknown) {
    deleteDialog.value = false
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    snackbarMessage.value = msg ?? 'Cannot delete the active season. Set another season as active first.'
    snackbar.value = true
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}
</script>

<style scoped>
.season-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  background: #1a1a1a;
  margin-bottom: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--active {
  background: #4caf50;
}

.status-dot--inactive {
  background: #555;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>
