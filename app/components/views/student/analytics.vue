<template>
  <div class="w-full">

    <!-- Not logged in -->
    <div v-if="!user" class="p-6 text-gray-500">
      Please log in to view your analytics.
    </div>

    <!-- Loading -->
    <div v-else-if="pending" class="p-6 text-gray-500">
      Loading your analytics...
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
 * Supabase user session
 */
const user = useSupabaseUser()

/**
 * Fetch analytics
 * API automatically filters:
 * - STUDENT → only their evaluations
 */
const { data, pending, error } = await useFetch<AnalyticsScoreEntry[]>(
  '/api/analytics/scores',
  {
    server: true,
    credentials: 'include',
    watch: [user] // refetch if user changes
  }
)

/**
 * Ensure charts always receive an array
 */
const analyticsData = computed<AnalyticsScoreEntry[]>(() => {
  return data.value ?? []
})
</script>