<script setup lang="ts" generic="T extends Record<string, any>">
import type { BulletLegendItemInterface } from "@unovis/ts"
import type { Component } from "vue"
import type { BaseChartProps } from "."
import { Axis, CurveType, Line } from "@unovis/ts"

import { VisAxis, VisLine, VisXYContainer } from "@unovis/vue"
import { useMounted } from "@vueuse/core"
import { computed, ref } from "vue"
import { cn } from "@/lib/utils"
import { ChartCrosshair, ChartLegend, defaultColors } from '@/components/ui/chart'

const props = withDefaults(defineProps<BaseChartProps<T> & {
  /**
   * Render custom tooltip component.
   */
  customTooltip?: Component
  /**
   * Type of curve
   */
  curveType?: CurveType
  /**
   * Axis labels
   */
  xLabel?: string
  yLabel?: string
}>(), {
  curveType: CurveType.MonotoneX,
  filterOpacity: 0.2,
  margin: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  showXAxis: true,
  showYAxis: true,
  showTooltip: true,
  showLegend: true,
  showGridLine: true,
  xLabel: '',
  yLabel: '',
})

const emits = defineEmits<{
  legendItemClick: [d: BulletLegendItemInterface, i: number]
}>()

type KeyOfT = Extract<keyof T, string>
type Data = typeof props.data[number]

const index = computed(() => props.index as KeyOfT)
const colors = computed(() =>
  props.colors?.length ? props.colors : defaultColors(props.categories.length)
)

const legendItems = ref<BulletLegendItemInterface[]>(
  props.categories.map((category, i) => ({
    name: category,
    color: colors.value[i],
    inactive: false,
  }))
)

const isMounted = useMounted()

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
  emits("legendItemClick", d, i)
}
</script>

<template>
  <div :class="cn('w-full h-[400px] flex flex-col items-end relative', $attrs.class ?? '')">
    <!-- Legend -->
    <ChartLegend
      v-if="showLegend"
      v-model:items="legendItems"
      @legend-item-click="handleLegendItemClick"
    />

    <!-- Chart container with axis labels -->
    <div class="relative w-full h-full flex flex-col items-center justify-center">
      <!-- Y-Axis Label -->
      <div
        v-if="props.yLabel"
        class="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-2xl font-bold text-foreground"
      >
        {{ props.yLabel }}
      </div>

      <!-- Main Chart -->
      <VisXYContainer
        :margin="{ left: 50, right: 20, top: 10, bottom: 50 }"
        :data="data"
        :style="{ height: isMounted ? '100%' : 'auto' }"
      >
        <ChartCrosshair
          v-if="showTooltip"
          :colors="colors"
          :items="legendItems"
          :index="index"
          :custom-tooltip="customTooltip"
        />

        <template v-for="(category, i) in categories" :key="category">
          <VisLine
            :x="(d: Data, i: number) => i"
            :y="(d: Data) => d[category]"
            :curve-type="curveType"
            :color="colors[i]"
            :attributes="{
              [Line.selectors.line]: {
                opacity: legendItems.find(item => item.name === category)?.inactive ? filterOpacity : 1,
              },
            }"
          />
        </template>

        <!-- X-Axis -->
        <VisAxis
          v-if="showXAxis"
          type="x"
          :tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
          :tick-values="data.map((_, i) => i)"
          :grid-line="false"
          :tick-line="false"
          tick-text-color="hsl(var(--vis-text-color))"
        />

        <!-- Y-Axis -->
        <VisAxis
          v-if="showYAxis"
          type="y"
          :tick-line="false"
          :tick-format="yFormatter"
          :domain-line="false"
          :grid-line="showGridLine"
          :attributes="{ [Axis.selectors.grid]: { class: 'text-muted' } }"
          tick-text-color="hsl(var(--vis-text-color))"
        />

        <slot />
      </VisXYContainer>

      <!-- X-Axis Label -->
      <div
        v-if="props.xLabel"
        class="absolute bottom-3 text-2xl font-bold text-foreground"
      >
        {{ props.xLabel }}
      </div>
    </div>
  </div>
</template>
