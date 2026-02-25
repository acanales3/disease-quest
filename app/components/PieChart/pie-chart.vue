<script setup lang="ts">
import { DonutChart } from "@/components/ui/chart-donut";
import { computed } from "vue";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";

import { ArrowUpDown, ChevronDown } from "lucide-vue-next";

const props = defineProps<{
  index: string;
  category: string;
  data: Record<string, any>[];
  type?: "pie" | "donut";
  header: string;
  categories: string[];
  renderDropdowns: boolean;
  renderLabels: boolean;
  label: number;
  sublabel: string;
}>();

// Map colors to categories (primary and secondary)
const colors = ["hsl(267, 93%, 88%)", "hsl(60, 90%, 70%)"];

const chartDataWithColors = computed(() =>
  props.data.map((item, i) => ({
    name: item[props.index],
    value: item[props.category],
    color: colors[i] || "#ccc",
  }))
);
</script>

<template>
  <div
    class="bg-white rounded-xl p-6 shadow-md flex flex-col items-center space-y-6"
  >
    <!-- Header -->
    <h2 class="text-xl font-semibold text-center">{{ props.header }}</h2>

    <!-- Category Legend -->
    <div class="flex gap-6">
      <div
        v-for="(item, idx) in chartDataWithColors"
        :key="item.name"
        class="flex items-center gap-2"
      >
        <span
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: item.color }"
        ></span>
        <span class="text-gray-700">{{ item.name }}</span>
      </div>
    </div>

    <!-- Donut Chart -->
    <DonutChart
      :index="props.index"
      :category="props.category"
      :data="props.data"
      :type="props.type"
      :central-label="props.label"
      :sublabel="props.sublabel"
      :renderLabels="props.renderLabels"
    />

    <!-- Dropdowns side by side -->
    <div class="flex gap-4">
      <!-- Date Dropdown -->
      <DropdownMenu v-if="props.renderDropdowns">
        <DropdownMenuTrigger as-child>
          <Button
            class="bg-gray-100 text-gray-500 hover:bg-gray-200 flex justify-between items-center px-4 py-2 rounded-md"
          >
            Date
            <ChevronDown class="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="bg-white rounded-md shadow-md flex flex-col"
        >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >January</DropdownMenuItem
          >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >February</DropdownMenuItem
          >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >March</DropdownMenuItem
          >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >April</DropdownMenuItem
          >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >May</DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Classroom Dropdown -->
      <DropdownMenu v-if="renderDropdowns">
        <DropdownMenuTrigger as-child>
          <Button
            class="bg-gray-100 text-gray-500 hover:bg-gray-200 flex justify-between items-center px-4 py-2 rounded-md"
          >
            Classroom
            <ChevronDown class="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="bg-white rounded-md shadow-md flex flex-col"
        >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >Example Class 0</DropdownMenuItem
          >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >Example Class 1</DropdownMenuItem
          >
          <DropdownMenuItem
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
            >Example Class 2</DropdownMenuItem
          >
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
