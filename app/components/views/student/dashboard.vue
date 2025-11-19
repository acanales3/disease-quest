<template>
    <div class="flex flex-col justify-start gap-4 w-full">
        <!-- Greeting Card -->
        <div class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6">
            <h1 class="text-lg font-bold text-gray-800">Hey {{ user.name }}!</h1>
            <p class="text-sm text-gray-500">Welcome back to DiseaseQuest!</p>
        </div>

        <!-- Stats Row -->
        <div class="flex justify-between gap-4">
            <TotalCount icon="mdi:check-circle" count="80%" label="Cases completed" />
            <TotalCount icon="mdi:clock-outline" count="258+" label="Cases in progress" />
            <TotalCount icon="mdi:circle-outline" count="64%" label="Cases not started" />
            <TotalCount icon="mdi:fire" count="245" label="Day Streak" />
        </div>

        <!-- Attempted Cases Table -->

        <div class="w-full py-2">
            <DataTable :columns="visibleColumns" :data="caseData" />
        </div>
        
    </div>
</template>

<script setup lang="ts">
import { getColumns } from '../../CaseDatatable/columns'
import DataTable from '../../CaseDatatable/data-table.vue'
import type { Case } from '../../CaseDatatable/columns'
import TotalCount from '@/components/ui/TotalCount.vue'
import { cases } from "~/assets/interface/Case";
import { onMounted, ref } from 'vue'
import { computed } from 'vue'

// Example user - replace with api data
const user = {
    name: 'Alex',
}

const caseData = ref<Case[]>([])

const visibleColumns = computed(() => {
  const columnsToShow = ['id', 'name', 'description', 'classroom', 'completionDate', 'status', 'actions'];
  return getColumns('student').filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

onMounted(async () => {
    // Fetch data from your API here.
    caseData.value = cases
})
</script>
