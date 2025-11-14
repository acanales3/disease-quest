<template>
  <div class="w-full py-2">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <Card class="bg-gradient-to-br from-blue-50 to-blue-100/50 border-0 hover:shadow-lg transition-all duration-300">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-blue-700 mb-0.5">Cases completed</p>
              <p class="text-2xl font-bold text-blue-900">{{ completionPercentage }}%</p>
            </div>
            <div class="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <Icon name="mdi:check-circle" class="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-gradient-to-br from-purple-50 to-purple-100/50 border-0 hover:shadow-lg transition-all duration-300">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-purple-700 mb-0.5">Cases in progress</p>
              <p class="text-2xl font-bold text-purple-900">{{ inProgressCount }}+</p>
            </div>
            <div class="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <Icon name="mdi:clock-outline" class="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-gradient-to-br from-amber-50 to-amber-100/50 border-0 hover:shadow-lg transition-all duration-300">
        <CardContent class="pt-4 pb-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-amber-700 mb-0.5">Cases not started</p>
              <p class="text-2xl font-bold text-amber-900">{{ notStartedPercentage }}%</p>
            </div>
            <div class="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
              <Icon name="mdi:alert-circle-outline" class="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-5 border-b border-gray-100">
        <h2 class="text-xl font-semibold text-gray-900">Attempted Cases</h2>
      </div>
      <div class="p-6">
        <DataTable :columns="visibleColumns" :data="data" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { columns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import { cases } from "~/assets/interface/Case";
import { Card, CardContent } from "~/components/ui/card";

const data = ref<Case[]>([]);

const visibleColumns = computed(() => {
  const columnsToShow = ['id', 'name', 'description', 'classroom', 'completionDate', 'status', 'actions'];
  return columns.filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

// Calculate statistics
const completedCount = computed(() => {
  return data.value.filter(c => c.status === 'completed').length;
});

const inProgressCount = computed(() => {
  return data.value.filter(c => c.status === 'in progress').length;
});

const notStartedCount = computed(() => {
  return data.value.filter(c => c.status === 'not started').length;
});

const completionPercentage = computed(() => {
  if (data.value.length === 0) return 0;
  return Math.round((completedCount.value / data.value.length) * 100);
});

const notStartedPercentage = computed(() => {
  if (data.value.length === 0) return 0;
  return Math.round((notStartedCount.value / data.value.length) * 100);
});

async function getData(): Promise<Case[]> {
  // Fetch data from your API here.
  return cases;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
