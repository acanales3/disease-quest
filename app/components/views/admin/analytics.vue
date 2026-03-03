<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Insights</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Analytics</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            View assessment scores by category, case, and classroom.
          </p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="uim:analytics" size="15" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ analyticsData.length }} score records</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pending" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading analytics...
    </div>

    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
      Failed to load analytics.
    </div>

    <template v-else>
      <ClassroomScores :data="analyticsData" />
      <AssessmentCategoryScoreGraph :data="analyticsData" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClassroomScores from '../../graph/ScoresByCategoryGraph.vue'
import AssessmentCategoryScoreGraph from '@/components/AssessmentCategoryScoreGraph/graph.vue'
import type { AnalyticsScoreEntry } from '@/types/analytics'
import { Icon } from '#components'

/**
 * Fetch analytics from your server API
 * (server/api/analytics/scores.get.ts → /api/analytics/scores)
 */
const { data, pending, error } = await useFetch<AnalyticsScoreEntry[]>(
  '/api/analytics/scores',
  {
    server: true, // fetch during SSR (recommended for admin pages)
    credentials: 'include'
  }
)

/**
 * Ensure charts always receive an array
 * (prevents crashes if data is null)
 */
const analyticsData = computed<AnalyticsScoreEntry[]>(() => {
  return data.value ?? []
})
</script>