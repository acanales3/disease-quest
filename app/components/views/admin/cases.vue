<template>
  <div class="container py-2 mx-auto">
    <DataTable :columns="visibleColumns" :data="data" />
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { columns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import { cases} from "~/assets/interface/Case.ts"

const data = ref<Case[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ['id', 'name', 'description', 'actions'];
  return columns.filter(column => 
    columnsToShow.includes(String(column.id || column.accessorKey))
  );
});

async function getData(): Promise<Case[]> {
  // Fetch data from your API here.
  return cases;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
