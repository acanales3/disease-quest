<template>
  <div class="p-6 bg-card rounded-2xl shadow-md overflow-x-auto">
    <div class="flex items-center justify-between mb-6">
      <!-- Left-aligned title -->
      <h2 class="text-xl font-semibold">{{ title }}</h2>

      <!-- Right-aligned dropdowns -->
      <div class="flex gap-3">
        <!-- Case selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3 py-2 bg-gray-100 rounded text-sm">
              {{ selectedCase?.name || 'Case' }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44">
            <template v-for="c in cases" :key="c.id">
              <ui-dropdown-menu-item @click="selectedCase = c">
                {{ c.name }}
              </ui-dropdown-menu-item>
            </template>
          </ui-dropdown-menu-content>
        </ui-dropdown-menu>

        <!-- Classroom selector -->
        <ui-dropdown-menu>
          <ui-dropdown-menu-trigger as-child>
            <button class="px-3 py-2 bg-gray-100 rounded text-sm">
              {{ selectedClassroom?.name || 'Classroom' }} ▾
            </button>
          </ui-dropdown-menu-trigger>
          <ui-dropdown-menu-content class="w-44">
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
    <div class="min-w-fit">
      <LineChart
        :data="props.data"
        :index="props.index"
        :categories="props.categories"
        :colors="colors"
        showTooltip
        :showLegend="false"
        showGridLine
        showXAxis
        showYAxis
        :xFormatter="(tick) => `Case ${tick}`"
        :yFormatter="(tick) => `${tick}%`"
        :margin="{ top: 20, right: 20, bottom: 50, left: 50 }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import LineChart from '@/components/ui/chart-line/LineChart.vue'
import type { GraphProps } from './types'

const props = defineProps<GraphProps>()

// Optional defaults
const colors = props.colors ?? ['#AF67F0']
const title = props.title ?? 'Assessment Category Score'

// Example reactive state for dropdowns
const cases = [
  { id: 1, name: 'Case 1' },
  { id: 2, name: 'Case 2' },
  { id: 3, name: 'Case 3' }
]

const classroomsList = [
  { id: 1, name: 'Classroom 1' },
  { id: 2, name: 'Classroom 2' },
  { id: 3, name: 'Classroom 3' }
]

const selectedCase = ref<any>(null)
const selectedClassroom = ref<any>(null)
</script>
