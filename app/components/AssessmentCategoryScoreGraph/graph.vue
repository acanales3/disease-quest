<script setup lang="ts">
import LineChart from '@/components/ui/chart-line/LineChart.vue'
import type { GraphProps } from './types'


const props = defineProps<GraphProps>()

// Optional defaults
const colors = props.colors ?? ['#AF67F0']
const title = props.title ?? 'Assessment Category Score'
</script>

<template>
  <div class="p-6 bg-card rounded-2xl shadow-md overflow-x-auto">
    <h2 class="text-xl font-semibold mb-4 text-center">{{ title }}</h2>
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
