<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Learning</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Cases</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            Play cases to practice clinical simulations.
          </p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="si:book-line" size="15" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ data.length }} available cases</span>
          </div>
        </div>
        <div class="sm:min-w-[460px] bg-gradient-to-r from-[#5f2a96] to-[#34204f] border border-[#4a2c6f] rounded-xl px-4 py-3">
          <p class="text-[11px] font-medium uppercase tracking-wider text-white/80">Progress Snapshot</p>
          <div class="mt-3 grid grid-cols-3 divide-x divide-white/20">
            <div class="pr-3">
              <p class="text-[10px] uppercase tracking-wider text-white/70">Completed</p>
              <p class="mt-1 text-[22px] font-semibold text-white tabular-nums leading-none">{{ completionPercentage }}%</p>
            </div>
            <div class="px-3">
              <p class="text-[10px] uppercase tracking-wider text-white/70">In Progress</p>
              <p class="mt-1 text-[22px] font-semibold text-white tabular-nums leading-none">{{ inProgressCount }}</p>
            </div>
            <div class="pl-3">
              <p class="text-[10px] uppercase tracking-wider text-white/70">Not Started</p>
              <p class="mt-1 text-[22px] font-semibold text-white tabular-nums leading-none">{{ notStartedPercentage }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pending" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading cases...
    </div>
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
      Failed to load cases.
    </div>
    <div v-else class="w-full">
      <DataTable :columns="visibleColumns" :data="data" @refresh="refresh()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { ref, computed, watchEffect } from "vue";
import { getColumns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import { Icon } from "#components";

const data = ref<Case[]>([]);

const { data: apiData, pending, error, refresh } = await useFetch<Case[]>(
  "/api/cases/available",
  {
    default: () => [],
  },
);

watchEffect(() => {
  data.value = apiData.value ?? [];
});

const visibleColumns = computed(() => {
  const columnsToShow = [
    "id",
    "name",
    "description",
    "classrooms",
    "status",
    "actions",
  ];
  return getColumns("student", {
    onRefresh: () => refresh(),
    returnTo: "/student/cases",
  }).filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
          ? column.accessorKey
          : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

// Statistics
const completedCount = computed(
  () => data.value.filter((c) => c.status === "completed").length,
);

const inProgressCount = computed(
  () => data.value.filter((c) => c.status === "in progress").length,
);

const notStartedCount = computed(
  () => data.value.filter((c) => c.status === "not started").length,
);

const completionPercentage = computed(() => {
  if (data.value.length === 0) return 0;
  return Math.round((completedCount.value / data.value.length) * 100);
});

const notStartedPercentage = computed(() => {
  if (data.value.length === 0) return 0;
  return Math.round((notStartedCount.value / data.value.length) * 100);
});
</script>
