<script setup lang="ts">
import { computed, toRef } from 'vue'
import { VisXYContainer, VisArea, VisAxis, VisCrosshair, VisTooltip, VisLine } from '@unovis/vue'
import type { BaseChartProps } from '../chart/interface'
import { ChartCrosshair, ChartTooltip, defaultColors } from '../chart'

const props = withDefaults(
  defineProps<
    BaseChartProps<any> & {
      type?: 'default' | 'stacked' | 'percent'
      curveType?: 'linear' | 'step' | 'stepAfter' | 'stepBefore' | 'basis' | 'cardinal' | 'monotoneX' | 'monotoneY' | 'natural'
      lineColor?: string
    }
  >(),
  {
    type: 'default',
    curveType: 'monotoneX',
    showXAxis: true,
    showYAxis: true,
    showTooltip: true,
    showLegend: true,
    showGridLine: true,
    filterOpacity: 0.2,
  },
)

const index = toRef(props, 'index')
const colors = computed(() => props.colors ?? defaultColors(props.categories.length))
const lineColors = computed(() => props.lineColor ? [props.lineColor] : ['#F59E0B'])

const x = (_: any, i: number) => i
const y = props.categories.map(category => (d: any) => d[category])
</script>

<template>
  <div class="chart-area">
    <VisXYContainer :data="data" :margin="margin">
      <VisArea
        :x="x"
        :y="y"
        :color="colors"
        :curve-type="curveType"
        :opacity="0.3"
      />
      <VisLine
        :x="x"
        :y="y"
        :color="lineColors"
        :curve-type="curveType"
        :line-width="2"
      />
      <VisAxis
        v-if="showXAxis"
        type="x"
        :tick-format="xFormatter"
        :grid-line="showGridLine"
        :label="(d: any) => data[d]?.[index] ?? ''"
      />
      <VisAxis
        v-if="showYAxis"
        type="y"
        :tick-format="yFormatter"
        :grid-line="showGridLine"
      />
      <VisCrosshair v-if="showTooltip" :template="ChartCrosshair" />
      <VisTooltip v-if="showTooltip">
        <template #default="{ items }">
          <ChartTooltip
            v-if="items && items.length"
            :title="data[items[0].index]?.[index]"
            :data="
              items.map((item: any, i: number) => ({
                name: categories[i],
                color: colors[i],
                value: item.value + '%',
              }))
            "
          />
        </template>
      </VisTooltip>
    </VisXYContainer>
  </div>
</template>

<style scoped>
.chart-area {
  width: 100%;
  height: 100%;
}
</style>

