<template>
  <div class="flex flex-col justify-start gap-4 w-full">
    <!-- Greeting Card -->
    <div
      class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6"
    >
      <h1 class="text-lg font-bold text-gray-800">Hey {{ displayName }}!</h1>
      <p class="text-sm text-gray-500">Welcome back to DiseaseQuest!</p>
    </div>

    <!-- Stats Row -->
    <div class="flex justify-between gap-4">
      <TotalCount
        icon="mdi:check-circle"
        :count="`${stats?.completedPercent ?? 0}%`"
        label="Cases completed"
      />
      <TotalCount
        icon="mdi:clock-outline"
        :count="stats?.inProgress ?? 0"
        label="Cases in progress"
      />
      <TotalCount
        icon="mdi:circle-outline"
        :count="`${stats?.notStartedPercent ?? 0}%`"
        label="Cases not started"
      />
      <TotalCount icon="mdi:fire" count="245" label="Day Streak" />
    </div>

    <!-- Attempted Cases Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="caseData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getColumns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import type { Case } from "../../CaseDatatable/columns";
import TotalCount from "@/components/ui/TotalCount.vue";
import { onMounted, ref } from "vue";
import { computed } from "vue";

type DashboardResponse = {
  user: { first_name: string | null; last_name: string | null };
  stats: any | null;
  cases: Case[];
};

const { data, pending, error } = await useFetch<DashboardResponse>(
  "/api/students/dashboard",
);

const displayName = computed(() => {
  const u = data.value?.user;
  if (!u) return "Student";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || "Student";
});

const stats = computed(() => data.value?.stats);

const caseData = computed(() => data.value?.cases ?? []);

const visibleColumns = computed(() => {
  const columnsToShow = [
    "id",
    "name",
    "description",
    "classroom",
    "completionDate",
    "status",
    "actions",
  ];
  return getColumns("student").filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
          ? column.accessorKey
          : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});
</script>
