<template>
  <div>
    <div class="d-flex align-center gap-2 mb-6">
      <v-btn
        icon="mdi-arrow-left"
        variant="text"
        size="small"
        color="onSurface"
        :to="{ name: 'AdminSeasons' }"
      />
      <h1 class="text-h5 font-weight-medium">Candidates</h1>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <v-skeleton-loader v-for="i in 4" :key="i" type="list-item-avatar" class="mb-2" />
    </template>

    <!-- Empty state -->
    <div v-else-if="candidates.length === 0" class="text-center py-8 text-onSurface mb-6">
      No candidates yet. Add the first one below.
    </div>

    <!-- Candidate list -->
    <template v-else>
      <div
        v-for="candidate in candidates"
        :key="candidate.id"
        class="candidate-row"
      >
        <!-- Avatar -->
        <div
          class="candidate-avatar"
          :style="candidate.photoUrl ? `background-image: url(${candidate.photoUrl})` : ''"
        >
          <span v-if="!candidate.photoUrl">{{ initials(candidate.name) }}</span>
        </div>

        <!-- Info -->
        <div class="flex-grow-1 overflow-hidden">
          <div class="text-body-2 font-weight-medium candidate-name">{{ candidate.name }}</div>
          <div v-if="candidate.description" class="text-caption text-onSurface candidate-desc">
            {{ candidate.description }}
          </div>
        </div>

        <!-- Status -->
        <status-badge :status="candidate.isActive ? 'Active' : 'Eliminated'" class="mr-3" />

        <!-- Actions -->
        <div class="d-flex align-center gap-1">
          <v-btn
            size="small"
            variant="text"
            icon="mdi-pencil-outline"
            color="onSurface"
            @click="openEdit(candidate)"
          />
          <v-btn
            size="small"
            variant="text"
            icon="mdi-trash-can-outline"
            color="error"
            @click="confirmDelete(candidate)"
          />
        </div>
      </div>
    </template>

    <!-- Add candidate form -->
    <v-card
      class="mt-6"
      style="background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 8px"
    >
      <v-card-title class="text-body-1 font-weight-medium pa-4 pb-2">
        Add candidate
      </v-card-title>
      <v-card-text class="pa-4 pt-2">
        <v-form @submit.prevent="handleAdd">
          <v-text-field
            v-model="addForm.name"
            label="Name"
            :error-messages="addErrors.name"
            class="mb-1"
          />
          <v-textarea
            v-model="addForm.description"
            label="Description (optional)"
            rows="2"
            auto-grow
            class="mb-1"
          />
          <v-file-input
            v-model="addForm.photo"
            label="Photo (optional)"
            accept="image/*"
            prepend-icon=""
            prepend-inner-icon="mdi-camera-outline"
            class="mb-2"
            clearable
          />

          <div v-if="addError" class="text-body-2 mb-3" style="color: #e84040">{{ addError }}</div>

          <div class="d-flex justify-end">
            <v-btn type="submit" color="primary" :loading="adding">Add candidate</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Edit dialog -->
    <v-dialog v-model="editDialog" max-width="480">
      <v-card style="background: #1a1a1a; border: 1px solid #2e2e2e">
        <v-card-title class="text-body-1 font-weight-medium pa-6 pb-2">
          Edit candidate
        </v-card-title>
        <v-card-text class="pa-6 pt-2">
          <v-form @submit.prevent="handleEdit">
            <v-text-field
              v-model="editForm.name"
              label="Name"
              :error-messages="editErrors.name"
              class="mb-1"
            />
            <v-textarea
              v-model="editForm.description"
              label="Description (optional)"
              rows="2"
              auto-grow
              class="mb-1"
            />
            <v-file-input
              v-model="editForm.photo"
              label="Replace photo (optional)"
              accept="image/*"
              prepend-icon=""
              prepend-inner-icon="mdi-camera-outline"
              clearable
            />
            <div v-if="editError" class="text-body-2 mt-2" style="color: #e84040">{{ editError }}</div>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" color="onSurface" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="editing" @click="handleEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="440">
      <v-card style="background: #1a1a1a; border: 1px solid #2e2e2e">
        <v-card-title class="text-body-1 font-weight-medium pa-6 pb-2">
          Delete candidate
        </v-card-title>
        <v-card-text class="pa-6 pt-2 text-body-2" style="color: #c8c4be">
          Are you sure you want to delete <strong style="color: #f0ede8">{{ deletingName }}</strong>?
          This cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" color="onSurface" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" :loading="deleting" @click="executeDelete">
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
import type { Candidate } from '@/api/candidates'
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { candidatesApi } from '@/api/candidates'
import StatusBadge from '@/components/StatusBadge.vue'

const route = useRoute()
const seasonId = route.params.id as string

const candidates = ref<Candidate[]>([])
const loading = ref(false)

// ── Add form ──────────────────────────────────────────────────────────────
const addForm = reactive({ name: '', description: '', photo: null as File[] | null })
const addErrors = reactive({ name: '' })
const addError = ref('')
const adding = ref(false)

// ── Edit dialog ───────────────────────────────────────────────────────────
const editDialog = ref(false)
const editingId = ref<string | null>(null)
const editForm = reactive({ name: '', description: '', photo: null as File[] | null })
const editErrors = reactive({ name: '' })
const editError = ref('')
const editing = ref(false)

// ── Delete dialog ─────────────────────────────────────────────────────────
const deleteDialog = ref(false)
const deletingId = ref<string | null>(null)
const deletingName = ref('')
const deleting = ref(false)

const snackbar = ref(false)
const snackbarMessage = ref('')

onMounted(fetchCandidates)

async function fetchCandidates() {
  loading.value = true
  try {
    const { data } = await candidatesApi.listBySeason(seasonId)
    candidates.value = data
  } finally {
    loading.value = false
  }
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

async function handleAdd() {
  addErrors.name = ''
  addError.value = ''

  if (!addForm.name.trim()) {
    addErrors.name = 'Name is required'
    return
  }

  adding.value = true
  try {
    const { data: candidate } = await candidatesApi.create(seasonId, {
      name: addForm.name.trim(),
      photoUrl: null,
      description: addForm.description.trim() || null,
    })

    if (addForm.photo?.[0]) {
      try {
        const { data: photoData } = await candidatesApi.uploadPhoto(candidate.id, addForm.photo[0])
        candidate.photoUrl = photoData.photoUrl
      } catch {
        // Photo upload failure is non-fatal
      }
    }

    candidates.value.push(candidate)
    addForm.name = ''
    addForm.description = ''
    addForm.photo = null
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    addError.value = msg ?? 'Something went wrong, try again.'
  } finally {
    adding.value = false
  }
}

function openEdit(candidate: Candidate) {
  editingId.value = candidate.id
  editForm.name = candidate.name
  editForm.description = candidate.description ?? ''
  editForm.photo = null
  editErrors.name = ''
  editError.value = ''
  editDialog.value = true
}

async function handleEdit() {
  editErrors.name = ''
  editError.value = ''

  if (!editForm.name.trim()) {
    editErrors.name = 'Name is required'
    return
  }

  if (!editingId.value) return
  editing.value = true

  try {
    const { data: updated } = await candidatesApi.update(editingId.value, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
    })

    if (editForm.photo?.[0]) {
      try {
        const { data: photoData } = await candidatesApi.uploadPhoto(
          editingId.value,
          editForm.photo[0],
        )
        updated.photoUrl = photoData.photoUrl
      } catch (error: unknown) {
        const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        editError.value = msg ?? 'Photo upload failed.'
        editing.value = false
        return
      }
    }

    const idx = candidates.value.findIndex((c) => c.id === editingId.value)
    if (idx !== -1) candidates.value[idx] = updated
    editDialog.value = false
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    editError.value = msg ?? 'Something went wrong, try again.'
  } finally {
    editing.value = false
  }
}

function confirmDelete(candidate: Candidate) {
  deletingId.value = candidate.id
  deletingName.value = candidate.name
  deleteDialog.value = true
}

async function executeDelete() {
  if (!deletingId.value) return
  deleting.value = true
  try {
    await candidatesApi.delete(deletingId.value)
    candidates.value = candidates.value.filter((c) => c.id !== deletingId.value)
    deleteDialog.value = false
  } catch (error: unknown) {
    deleteDialog.value = false
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    snackbarMessage.value = msg ?? 'Could not delete candidate.'
    snackbar.value = true
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}
</script>

<style scoped>
.candidate-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  background: #1a1a1a;
  margin-bottom: 6px;
}

.candidate-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2e2e2e;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #c8c4be;
  flex-shrink: 0;
  margin-right: 12px;
}

.candidate-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.candidate-desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>
