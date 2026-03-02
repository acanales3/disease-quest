<template>
  <div class="flex flex-col w-full gap-8">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Content</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight">Cases</h1>
          <p class="text-gray-500 text-[15px] mt-2">Manage case library and assign cases to classrooms.</p>
          <div class="mt-3 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-[#4d1979] text-white text-xs font-medium px-3 py-1 rounded-full">
              <Icon name="lucide:book-open" size="11" />
              {{ data.length }} cases
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <CreateCaseDialog />
          <AssignCaseDialog :cases="data" :classrooms="classroomsData" />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-sm text-gray-500">Loading cases...</div>
    <div v-else-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ errorMessage }}
    </div>

    <div v-else>
      <DataTable :columns="visibleColumns" :data="data" :classrooms="classroomsData" @refresh="refreshCases()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import type { Classroom } from "~/assets/interface/Classroom";
import { computed, watchEffect, ref } from "vue";
import { getColumns } from "@/components/CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import CreateCaseDialog from "../../../components/CreateCaseDialog/CreateCaseDialog.vue";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";
import { Icon } from "#components";

const {
  data: apiData,
  pending: casesPending,
  error: casesError,
  refresh: refreshCases,
} = await useFetch<Case[]>("/api/cases/available", { default: () => [] });

const {
  data: classroomsApi,
  pending: classroomsPending,
  error: classroomsError,
} = await useFetch<Classroom[]>("/api/classrooms", { default: () => [] });

const data = ref<Case[]>([]);
const classroomsData = ref<Classroom[]>([]);

watchEffect(() => {
  data.value = apiData.value ?? [];
  classroomsData.value = classroomsApi.value ?? [];
});

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "status", "actions"];
  return getColumns("admin", () => refreshCases()).filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
          ? column.accessorKey
          : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

const isLoading = computed(() => casesPending.value || classroomsPending.value);

const errorMessage = computed(() => {
  const e: any = casesError.value || classroomsError.value;
  if (!e) return "";
  if (e.statusCode === 401) return "You are not logged in.";
  if (e.statusCode === 403) return "You do not have permission to view cases.";
  if (e.statusCode === 400) return e.statusMessage || "Bad request.";
  return e.statusMessage || e.message || "Unknown error.";
});
</script>
