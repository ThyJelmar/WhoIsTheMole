<template>
  <span class="status-badge" :class="`status-badge--${status.toLowerCase()}`">
    {{ label }}
  </span>
</template>

<script lang="ts" setup>
import type { ParticipationStatus } from '@/api/candidates'
import { computed } from 'vue'

const props = defineProps<{
  status: ParticipationStatus
}>()

const label = computed(() => {
  switch (props.status) {
    case 'Active': {
      return 'Active'
    }
    case 'Eliminated': {
      return 'Eliminated'
    }
    case 'Returned': {
      return 'Returned'
    }
    default: {
      return props.status
    }
  }
})
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.8;
}

.status-badge--active {
  background: #1a3d1a;
  color: #4caf50;
}

.status-badge--eliminated {
  background: #1a1a1a;
  color: #666;
}

.status-badge--returned {
  background: #1a2e3d;
  color: #378add;
}
</style>
