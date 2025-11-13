<template>
  <div class="flex flex-col w-full">
    <!-- Num Cases & Create Case Button -->
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Cases"
        icon="si:book-line"
      />
      <AssignCaseDialog  />
    </div>
    
    <!-- Cases Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { columns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import { cases} from "~/assets/interface/Case"
import TotalCount from "~/components/ui/TotalCount.vue";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";

const data = ref<Case[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ['id', 'name', 'description', 'actions'];
  return columns.filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

async function getData(): Promise<Case[]> {
  // Fetch data from your API here.
  return cases;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
