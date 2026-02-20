<template>
  <div class="w-full">

    <!-- Loading state -->
    <div v-if="pending" class="p-6 text-gray-500">
      Loading analytics...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-6 text-red-500">
      Failed to load analytics.
    </div>

    <!-- Charts -->
    <template v-else>
      <ClassroomScores
        class="mb-8"
        :data="analyticsData"
      />

      <AssessmentCategoryScoreGraph
        :data="analyticsData"
      />
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ClassroomScores from '../../graph/ScoresByCategoryGraph.vue'
import AssessmentCategoryScoreGraph from '@/components/AssessmentCategoryScoreGraph/graph.vue'
import type { AnalyticsScoreEntry } from '@/types/analytics'

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