import type { MoleScore } from '@/api/scores'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import CandidateCard from '@/components/CandidateCard.vue'

const vuetify = createVuetify()

function makeScore(overrides: Partial<MoleScore> = {}): MoleScore {
  return {
    candidateId: 'c1',
    candidateName: 'Alice Doe',
    photoUrl: null,
    status: 'Active',
    totalMoneyEarned: 100,
    totalMoneyLost: 10,
    totalKeyPositions: 2,
    totalSuspiciousActs: 1,
    totalTimesAccused: 3,
    totalAccusedByEliminated: 0,
    score: 75,
    scorePerEpisode: [75],
    ...overrides,
  }
}

function mountCard(score: MoleScore, rank = 1, maxScore = 100) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/candidates/:id', name: 'CandidateDetail', component: { template: '<div />' } },
    ],
  })
  return {
    wrapper: mount(CandidateCard, {
      props: { candidate: score, rank, maxScore },
      global: { plugins: [vuetify, router] },
    }),
    router,
  }
}

describe('CandidateCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('applies opacity 0.5 when status is Eliminated', () => {
    const { wrapper } = mountCard(makeScore({ status: 'Eliminated' }))
    expect(wrapper.classes()).toContain('candidate-row--eliminated')
  })

  it('does not apply eliminated class when Active', () => {
    const { wrapper } = mountCard(makeScore({ status: 'Active' }))
    expect(wrapper.classes()).not.toContain('candidate-row--eliminated')
  })

  it('navigates to /candidates/:id on click', async () => {
    const { wrapper, router } = mountCard(makeScore({ candidateId: 'c42' }))
    await wrapper.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('CandidateDetail')
    expect(router.currentRoute.value.params.id).toBe('c42')
  })

  it('shows initials when no photoUrl', () => {
    const { wrapper } = mountCard(makeScore({ candidateName: 'Alice Doe', photoUrl: null }))
    expect(wrapper.text()).toContain('AD')
  })

  it('shows return icon when status is Returned', () => {
    const { wrapper } = mountCard(makeScore({ status: 'Returned' }))
    expect(wrapper.text()).toContain('↩')
  })
})
