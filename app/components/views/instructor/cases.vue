<template>
  <div class="flex flex-col w-full">
    <!-- Num Cases & Create Case Button -->
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="casesData.length"
        label="Total Cases"
        icon="si:book-line"
      />
      <AssignCaseDialog :cases="casesData" :classrooms="classroomsData" />
    </div>
    
    <!-- Cases Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="casesData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import type { Classroom } from "~/assets/interface/Classroom";
import { computed, ref, watchEffect } from "vue";
import { getColumns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import TotalCount from "~/components/ui/TotalCount.vue";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";

const casesData = ref<Case[]>([]);
const classroomsData = ref<Classroom[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "actions"];
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
const { data: casesApi } = await useFetch<Case[]>("/api/cases/available", {
  default: () => [],
});

const { data: classroomsApi } = await useFetch<Classroom[]>("/api/classrooms", {
  default: () => [],
});

// bind into your existing refs
watchEffect(() => {
  casesData.value = casesApi.value ?? [];
  classroomsData.value = classroomsApi.value ?? [];
});
</script>
