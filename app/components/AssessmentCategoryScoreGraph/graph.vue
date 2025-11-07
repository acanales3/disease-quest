<script setup lang="ts">
import LineChart from '@/components/ui/chart-line/LineChart.vue'
import type { CaseScore } from './types'

// Props
interface GraphProps {
  data: CaseScore[]
  index: keyof CaseScore
  categories: (keyof CaseScore)[]
  colors?: string[]
  title?: string
}

const props = defineProps<GraphProps>()

// Optional defaults
const colors = props.colors ?? ['#AF67F0']
const title = props.title ?? 'Assessment Category Score'
</script>

<template>
  <div class="p-6 bg-card rounded-2xl shadow-md">
    <h2 class="text-xl font-semibold mb-4 text-center">{{ title }}</h2>
    <LineChart
    :data="props.data"
    :index="props.index"
    :categories="props.categories"
    :colors="colors"
    showTooltip
    showLegend
    showGridLine
    showXAxis
    showYAxis
    :xFormatter="(tick, i) => `Case ${i + 1}`"
    :yFormatter="(tick) => `${tick}%`"
    :margin="{ top: 20, right: 20, bottom: 50, left: 50 }"
    />
  </div>
</template>
