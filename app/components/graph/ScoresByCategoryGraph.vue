<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6">
    <div class="flex items-start justify-between mb-7">
      <h3 class="text-[20px] font-semibold tracking-tight text-gray-900">Assessment Score by Category</h3>

      <div class="flex gap-3">
        <!-- Case selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3.5 h-9 border border-gray-200 rounded-lg text-[13px] font-medium min-w-[130px] flex justify-between items-center text-gray-700 bg-white">
              {{ selectedCase?.name || "All Cases" }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
             <ui-dropdown-menu-item @click="selectedCase = null">All Cases</ui-dropdown-menu-item>
            <template v-for="c in cases" :key="c.id">
              <ui-dropdown-menu-item @click="selectedCase = c">{{
                c.name
              }}</ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>

        <!-- Classroom selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3.5 h-9 border border-gray-200 rounded-lg text-[13px] font-medium min-w-[140px] flex justify-between items-center text-gray-700 bg-white">
              {{ selectedClassroom?.name || "All Classrooms" }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
             <ui-dropdown-menu-item @click="selectedClassroom = null">All Classrooms</ui-dropdown-menu-item>
            <template v-for="r in classroomsList" :key="r.id">
              <ui-dropdown-menu-item @click="selectedClassroom = r">{{
                r.name
              }}</ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </div>
    </div>

    <div class="space-y-4.5" v-if="!loading && processedCategories.length">
      <template v-for="(cat, i) in processedCategories" :key="i">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <div
              class="w-full bg-gray-100 rounded-full h-10 relative overflow-visible"
            >
              <div class="bg-[#d9d2ea] h-10 rounded-full transition-all duration-500" :style="{ width: cat.score + '%' }"></div>

              <!-- percentage pill anchored to the end of the filled area -->
              <div
                class="absolute top-1/2 z-10 px-2.5 py-0.5 bg-white border rounded-full text-[11px] font-medium text-gray-700 shadow-sm transition-all duration-500"
                :style="{
                  left: pillLeft(cat.score),
                  transform: 'translate(-50%, -50%)',
                }"
              >
                {{ cat.score }}%
              </div>
            </div>
          </div>

          <div class="w-60 text-right text-[13px] font-medium text-gray-700 leading-snug">
            {{ cat.label }}
          </div>
        </div>
      </template>
    </div>
    <div v-else-if="loading" class="text-center py-8 text-sm text-gray-500">
        Loading data...
    </div>
    <div v-else class="text-center py-8 text-sm text-gray-500">
        No data available for the selected filters.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import type { AnalyticsScoreEntry } from '@/types/analytics'
import { useRoute } from '#imports'

const route = useRoute()

type Category = { label: string; score: number };
type Item = { id: number; name: string };

const props = defineProps<{
  data: AnalyticsScoreEntry[];
  loading?: boolean;
}>()

const selectedCase = ref<Item | null>(null);
const selectedClassroom = ref<Item | null>(null);

// Derive Unique Lists from Data
const cases = computed(() => {
    const map = new Map<number, string>()
    props.data.forEach(d => map.set(d.caseId, d.caseName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name))
})

const classroomsList = computed(() => {
    const map = new Map<number, string>()
    props.data.forEach(d => map.set(d.classroomId, d.classroomName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name))
})

watchEffect(() => {
    const classroomIdQuery = route.query.classroomId
    if (classroomIdQuery) {
        const id = Number(classroomIdQuery)
        const nameQuery = route.query.classroomName as string
        const found = classroomsList.value.find(c => c.id === id)
        if (found) {
            selectedClassroom.value = found
        } else {
            selectedClassroom.value = { id, name: nameQuery || 'Selected Classroom' }
        }
    }
})

// Compute Aggregated Scores
const processedCategories = computed<Category[]>(() => {
    if (!props.data || !props.data.length) return []

    // 1. Filter
    const filtered = props.data.filter(d => {
        if (selectedCase.value && d.caseId !== selectedCase.value.id) return false
        if (selectedClassroom.value && d.classroomId !== selectedClassroom.value.id) return false
        return true
    })

    if (!filtered.length) return []

    // 2. Aggregate (Weighted Average)
    const totalCount = filtered.reduce((sum, d) => sum + d.count, 0)
    if (totalCount === 0) return []

    const weightedSum = (field: keyof AnalyticsScoreEntry) => {
        return filtered.reduce((sum, d) => sum + (d[field] as number * d.count), 0)
    }

    const avg = (field: keyof AnalyticsScoreEntry) => Math.round(weightedSum(field) / totalCount * 10) / 10

    return [
      { label: 'History Taking and Synthesis', score: avg('history_taking_synthesis') },
      { label: 'Physical Exam Interpretation', score: avg('physical_exam_interpretation') },
      { label: 'Differential Diagnosis Formulation', score: avg('differential_diagnosis_formulation') },
      { label: 'Diagnostic Tests', score: avg('diagnostic_tests') },
      { label: 'Management Reasoning', score: avg('management_reasoning') },
      { label: 'Communication and Empathy', score: avg('communication_empathy') },
      { label: 'Reflection and Metacognition', score: avg('reflection_metacognition') },
    ]
})

const pillLeft = (score: number) => {
  const min = 3; // percent from left edge
  const max = 97; // percent from left edge
  const clamped = Math.min(Math.max(Math.round(score), min), max);
  return `${clamped}%`;
};
</script>

<style scoped></style>
