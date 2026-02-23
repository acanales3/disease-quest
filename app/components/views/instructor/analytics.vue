<template>
  <div class="w-full">

    <!-- Loading -->
    <div v-if="pending" class="p-6 text-gray-500">
      Loading analytics...
    </div>

    <!-- Error -->
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
 * Fetch analytics
 * API automatically filters based on role:
 * - INSTRUCTOR → their classrooms only
 * - STUDENT → their work
 * - ADMIN → everything
 */
const { data, pending, error } = await useFetch<AnalyticsScoreEntry[]>(
  '/api/analytics/scores',
  {
    server: true,
    credentials: 'include'
  }
)

/**
 * Ensure charts always receive an array
 */
const analyticsData = computed<AnalyticsScoreEntry[]>(() => {
  return data.value ?? []
})
</script>