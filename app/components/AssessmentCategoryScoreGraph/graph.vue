<template>
  <div class="p-6 bg-card rounded-2xl shadow-md overflow-x-auto">
    <div class="flex items-center justify-between mb-6">
      <!-- Left-aligned title -->
      <h2 class="text-xl font-semibold">{{ title }}</h2>

      <!-- Right-aligned dropdowns -->
      <div class="flex gap-3">
        <!-- Category selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3 py-2 bg-gray-100 rounded text-sm min-w-[150px] flex justify-between items-center">
              {{ selectedCategory?.name || 'All Categories' }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-64 max-h-60 overflow-y-auto">
             <ui-dropdown-menu-item @click="selectedCategory = null">All Categories</ui-dropdown-menu-item>
            <template v-for="c in categoryList" :key="c.id">
              <ui-dropdown-menu-item @click="selectedCategory = c">
                {{ c.name }}
              </ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>

        <!-- Classroom selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3 py-2 bg-gray-100 rounded text-sm min-w-[120px] flex justify-between items-center">
              {{ selectedClassroom?.name || 'All Classrooms' }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44 max-h-60 overflow-y-auto">
            <ui-dropdown-menu-item @click="selectedClassroom = null">All Classrooms</ui-dropdown-menu-item>
            <template v-for="r in classroomsList" :key="r.id">
              <ui-dropdown-menu-item @click="selectedClassroom = r">
                {{ r.name }}
              </ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>
      </div>
    </div>

    <!-- Chart -->
    <div class="min-w-fit" v-if="!loading && chartData.length">
      <LineChart
        :data="chartData"
        :index="index"
        :categories="activeCategories"
        :colors="colors"
        showTooltip
        showLegend
        legendPosition="bottom"
        showGridLine
        showXAxis
        showYAxis
        xLabel="Cases"
        yLabel="Average Score"
        :margin="{ top: 20, right: 20, bottom: 80, left: 50 }"
      />
    </div>
     <div v-else-if="loading" class="text-center py-8 text-gray-500">
        Loading chart...
    </div>
    <div v-else class="text-center py-8 text-gray-500">
        No data available for the selected filters.
    </div>
  </div>
</template>

<script setup lang="ts">
import LineChart from '@/components/ui/chart-line/LineChart.vue'
import type { AnalyticsScoreEntry } from '@/types/analytics'
import { computed, ref } from 'vue'

const props = defineProps<{
    data: AnalyticsScoreEntry[];
    loading?: boolean;
    title?: string;
    colors?: string[];
}>()

// Optional defaults
// const colors = props.colors ?? ['#AF67F0'] // Single color default
// We need multiple colors for multi-line.
const defaultColors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6'
]
const colors = computed(() => props.colors ?? defaultColors)
const title = props.title ?? 'Assessment Category Score'

// categories mapping
const KEY_TO_LABEL: Record<string, string> = {
    history_taking_synthesis: 'History Taking and Synthesis',
    physical_exam_interpretation: 'Physical Exam Interpretation',
    differential_diagnosis_formulation: 'Differential Diagnosis Formulation',
    diagnostic_tests: 'Diagnostic Tests',
    management_reasoning: 'Management Reasoning',
    communication_empathy: 'Communication and Empathy',
    reflection_metacognition: 'Reflection and Metacognition',
}

const categoryList = Object.entries(KEY_TO_LABEL).map(([key, label], i) => ({
    id: key,
    name: label
}))

const classroomsList = computed(() => {
    const map = new Map<number, string>()
    props.data.forEach(d => map.set(d.classroomId, d.classroomName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name))
})

const selectedCategory = ref<{ id: string, name: string } | null>(null)
const selectedClassroom = ref<{ id: number, name: string } | null>(null)

const index = 'case' // X-axis key in the transformed data

// Compute Chart Data
const chartData = computed(() => {
    if (!props.data || !props.data.length) return []

    // 1. Filter by Classroom
    const filtered = props.data.filter(d => {
        if (selectedClassroom.value && d.classroomId !== selectedClassroom.value.id) return false
        return true
    })

    // 2. Group by Case (because we might have multiple classrooms per case selected)
    // Map<caseId, { name, entries: [] }>
    const caseGroups = new Map<number, { name: string, entries: AnalyticsScoreEntry[] }>()
    
    filtered.forEach(d => {
        if (!caseGroups.has(d.caseId)) {
            caseGroups.set(d.caseId, { name: d.caseName, entries: [] })
        }
        caseGroups.get(d.caseId)!.entries.push(d)
    })

    // 3. Aggregate per Case and Transform keys
    const result: any[] = []

    // keys to process
    const keysToProcess = selectedCategory.value ? [selectedCategory.value.id] : Object.keys(KEY_TO_LABEL)

    Array.from(caseGroups.values()).forEach(group => {
        const row: any = { case: group.name }
        
        const totalCount = group.entries.reduce((sum, e) => sum + e.count, 0)

        keysToProcess.forEach(key => {
            const label = KEY_TO_LABEL[key]
            if (!label) return

            // weighted average
            let weightedSum = 0
            group.entries.forEach(e => {
                weightedSum += (e[key as keyof AnalyticsScoreEntry] as number) * e.count
            })
            
            row[label] = totalCount > 0 ? Math.round(weightedSum / totalCount * 100) / 100 : 0
        })

        result.push(row)
    })
    
    return result
})

const activeCategories = computed(() => {
    if (selectedCategory.value) return [selectedCategory.value.name]
    return Object.values(KEY_TO_LABEL)
})

</script>
