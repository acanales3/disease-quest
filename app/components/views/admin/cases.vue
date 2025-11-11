<template>
  <div>
    <!-- Num Cases & Create Case Button -->
    <div class="flex justify-center gap-4">
      <CreateCaseDialog />
    </div>
    
    <!-- Cases Table -->
    <div class="container py-2 mx-auto">
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
import CreateCaseDialog from "../../../components/CreateCaseDialog/CreateCaseDialog.vue";

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
