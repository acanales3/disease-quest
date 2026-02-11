<template>
  <div class="flex flex-col w-full">
    <div class="flex justify-center gap-4">
      <TotalCount
        icon="mdi:check-circle"
        :count="`${completionPercentage}%`"
        label="Cases completed"
      />

      <TotalCount
        icon="mdi:clock-outline"
        :count="`${inProgressCount}+`"
        label="Cases in progress"
      />

      <TotalCount
        icon="mdi:circle-outline"
        :count="`${notStartedPercentage}%`"
        label="Cases not started"
      />
    </div>

    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { ref, computed, watchEffect } from "vue";
import { getColumns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import TotalCount from "../../ui/TotalCount.vue";

const data = ref<Case[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ['id', 'name', 'description', 'classroom', 'completionDate', 'status', 'actions'];
  return getColumns('student').filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

// API call
const { data: apiData } = await useFetch<Case[]>("/api/cases/available", {
  default: () => [],
});

watchEffect(() => {
  data.value = apiData.value ?? [];
});

// Calculate statistics
const completedCount = computed(() => {
  return data.value.filter(c => c.status === 'completed').length;
});

const inProgressCount = computed(() => {
  return data.value.filter(c => c.status === 'in progress').length;
});

const notStartedCount = computed(() => {
  return data.value.filter(c => c.status === 'not started').length;
});

const completionPercentage = computed(() => {
  if (data.value.length === 0) return 0;
  return Math.round((completedCount.value / data.value.length) * 100);
});

const notStartedPercentage = computed(() => {
  if (data.value.length === 0) return 0;
  return Math.round((notStartedCount.value / data.value.length) * 100);
});
</script>
