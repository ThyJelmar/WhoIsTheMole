<template>
  <v-app theme="mole">
    <!-- Auth routes: no chrome -->
    <template v-if="isPublicRoute">
      <v-main style="background: #0d0d0d">
        <router-view />
      </v-main>
    </template>

    <!-- App shell: sidebar + top bar -->
    <template v-else>
      <!-- Top bar -->
      <v-app-bar
        height="56"
        style="background: #1a1a1a; border-bottom: 1px solid #2e2e2e"
        elevation="0"
      >
        <v-app-bar-nav-icon v-if="mobile" @click="drawer = !drawer" color="onBackground" />
        <v-toolbar-title class="text-body-1 font-weight-medium">Who Is The Mole</v-toolbar-title>
        <template #append>
          <span class="text-body-2 text-onSurface mr-3">{{ authStore.name }}</span>
          <v-btn
            icon="mdi-logout-variant"
            variant="text"
            size="small"
            color="onSurface"
            class="mr-2"
            @click="handleLogout"
          />
        </template>
      </v-app-bar>

      <!-- Sidebar -->
      <v-navigation-drawer
        v-model="drawer"
        :permanent="!mobile"
        width="240"
        style="background: #111111; border-right: 1px solid #2e2e2e"
      >
        <v-list nav density="compact" class="pa-2 mt-2">
          <v-list-item
            prepend-icon="mdi-view-dashboard-outline"
            title="Dashboard"
            :to="{ name: 'Dashboard' }"
            active-color="primary"
            rounded="lg"
          />
          <v-list-item
            prepend-icon="mdi-clipboard-edit-outline"
            title="Episodes"
            :to="{ path: '/episodes' }"
            active-color="primary"
            rounded="lg"
          />
        </v-list>

        <!-- Admin section -->
        <template v-if="authStore.isAdmin">
          <v-divider class="mx-2 my-2" style="border-color: #2e2e2e" />
          <div class="px-4 py-1">
            <span
              class="text-caption text-onSurface"
              style="letter-spacing: 0.08em; text-transform: uppercase"
              >Admin</span
            >
          </div>
          <v-list nav density="compact" class="pa-2">
            <v-list-item
              prepend-icon="mdi-television-play"
              title="Seasons"
              :to="{ name: 'AdminSeasons' }"
              active-color="primary"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-account-group-outline"
              title="Candidates"
              :to="{ name: 'AdminCandidates' }"
              active-color="primary"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-account-multiple-outline"
              title="Users"
              :to="{ name: 'AdminUsers' }"
              active-color="primary"
              rounded="lg"
            />
          </v-list>
        </template>
      </v-navigation-drawer>

      <!-- Main content -->
      <v-main style="background: #0d0d0d">
        <div class="content-wrapper">
          <router-view />
        </div>
      </v-main>
    </template>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { mobile } = useDisplay()

const drawer = ref(true)

const publicRoutes = new Set(['Login', 'Register'])
const isPublicRoute = computed(() => publicRoutes.has(String(route.name)))

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style>
html,
body {
  font-family: 'Inter', sans-serif;
  background: #0d0d0d;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-weight: 500;
  letter-spacing: -0.01em;
}

body {
  line-height: 1.7;
}
</style>

<style scoped>
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}
</style>
