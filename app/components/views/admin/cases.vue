<template>
  <div class="flex flex-col w-full">
    <!-- Num Cases & Create Case Button -->
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Cases"
        icon="si:book-line"
      />
      <CreateCaseDialog />
    </div>

    <div class="w-full py-2">
      <!-- Cases Table -->
      <DataTable  :columns="visibleColumns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { computed, watchEffect, ref } from "vue";
import { getColumns } from "@/components/CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import CreateCaseDialog from "../../../components/CreateCaseDialog/CreateCaseDialog.vue";
import TotalCount from "../../../components/ui/TotalCount.vue";

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "actions"];
  return getColumns("admin").filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
          ? column.accessorKey
          : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

// Call your API
const { data: apiData, pending, error, refresh } = await useFetch<Case[]>(
  "/api/cases/available",
  { default: () => [] }
);

// Adapt into your existing `data` ref
const data = ref<Case[]>([]);
watchEffect(() => {
  data.value = apiData.value ?? [];
});

const errorMessage = computed(() => {
  const e: any = error.value;
  if (!e) return "";
  // Nuxt useFetch errors often have statusCode/statusMessage
  if (e.statusCode === 401) return "You are not logged in.";
  if (e.statusCode === 403) return "You do not have permission to view cases.";
  if (e.statusCode === 400) return e.statusMessage || "Bad request.";
  return e.statusMessage || e.message || "Unknown error.";
});
</script>
