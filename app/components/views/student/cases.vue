<template>
  <div class="w-full space-y-6">
    <!-- Page Title -->
    <div class="text-2xl font-semibold text-gray-800">
      Student Cases
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Cases Completed Card -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ completedPercentage }}%</div>
            <div class="text-sm text-gray-500">Cases completed</div>
          </div>
          <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon name="mdi:check-circle-outline" class="text-2xl text-blue-500" />
          </div>
        </div>
      </div>

      <!-- Cases in Progress Card -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ inProgressCount }}+</div>
            <div class="text-sm text-gray-500">Cases in progress</div>
          </div>
          <div class="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
            <Icon name="mdi:progress-clock" class="text-2xl text-purple-500" />
          </div>
        </div>
      </div>

      <!-- Cases Not Started Card -->
      <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="text-3xl font-bold text-gray-900 mb-1">{{ notStartedPercentage }}%</div>
            <div class="text-sm text-gray-500">Cases not started</div>
          </div>
          <div class="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
            <Icon name="mdi:clock-outline" class="text-2xl text-yellow-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Cases Data Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { columns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import { cases } from "~/assets/interface/Case";

const data = ref<Case[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ['id', 'name', 'classroom', 'completionDate', 'status', 'actions'];
  return columns.filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

// Computed statistics
const completedCount = computed(() => {
  return data.value.filter(c => c.status === "completed").length;
});

const inProgressCount = computed(() => {
  return data.value.filter(c => c.status === "in progress").length;
});

const notStartedCount = computed(() => {
  return data.value.filter(c => c.status === "not started").length;
});

const totalCases = computed(() => data.value.length);

const completedPercentage = computed(() => {
  if (totalCases.value === 0) return 0;
  return Math.round((completedCount.value / totalCases.value) * 100);
});

const notStartedPercentage = computed(() => {
  if (totalCases.value === 0) return 0;
  return Math.round((notStartedCount.value / totalCases.value) * 100);
});

async function getData(): Promise<Case[]> {
  // Fetch data from your API here.
  return cases;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
