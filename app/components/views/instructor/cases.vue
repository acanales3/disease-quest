<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Content</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight">Cases</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            Review your assigned case library and distribute cases to classrooms.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">
              <Icon name="lucide:book-open" size="11" />
              {{ casesData.length }} cases
            </span>
          </div>
        </div>
        <div class="shrink-0">
          <AssignCaseDialog :cases="casesData" :classrooms="classroomsData" />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading cases...
    </div>

    <div v-else-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="w-full">
      <DataTable :columns="visibleColumns" :data="casesData" :classrooms="classroomsData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import type { Classroom } from "~/assets/interface/Classroom";
import { computed, ref, watchEffect } from "vue";
import { getColumns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";

const casesData = ref<Case[]>([]);
const classroomsData = ref<Classroom[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "classrooms", "actions"];
  return getColumns("instructor").filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
          ? column.accessorKey
          : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

// API calls
const { data: casesApi, pending: casesPending, error: casesError } = await useFetch<Case[]>("/api/cases/available", {
  default: () => [],
});

const { data: classroomsApi, pending: classroomsPending, error: classroomsError } = await useFetch<Classroom[]>("/api/classrooms", {
  default: () => [],
});

const isLoading = computed(() => casesPending.value || classroomsPending.value);
const errorMessage = computed(() => {
  const message =
    (casesError.value as any)?.data?.message ||
    (casesError.value as any)?.statusMessage ||
    (classroomsError.value as any)?.data?.message ||
    (classroomsError.value as any)?.statusMessage;

  return message ? `Unable to load cases data: ${message}` : "";
});

// bind into your existing refs
watchEffect(() => {
  casesData.value = casesApi.value ?? [];
  classroomsData.value = classroomsApi.value ?? [];
});
</script>
