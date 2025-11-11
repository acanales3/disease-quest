<template>
  <div>
    
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Classrooms"
        icon="ic:baseline-people"
      />
      
      <Button
        variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4"
        @click="navigateToCreateClassroom"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="ic:baseline-add" size="28" class="#ad46ff" />
          <span class="text-sm">Create Classroom</span>
        </div>
      </Button>
    </div>

    <div class="container py-2 mx-auto">
      <DataTable :columns="columns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { columns } from "../../ClassroomDatatable/columns";
import { classrooms } from "../../../assets/interface/Classroom";
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'
import { Button } from '../../ui/button'
import { Icon } from '#components'

const router = useRouter()


const data = ref<Classroom[]>([]);

const visibleColumns = computed(() => {
  return columns.map((col) => {
    const columnsToShow = [
      "id",
      "name",
      "code",
      "section",
      "startDate",
      "endDate",
      "status",
    ];

    return {
      ...col,
      meta: {
        ...col.meta,
        hidden: !columnsToShow.includes(col.accessorKey as string),
      },
    };
  });
});

async function getData(): Promise<Classroom[]> {
  // Fetch data from your API here.
  return classrooms;
}

function navigateToCreateClassroom() {
  router.push('/instructor/create-classroom');
}

onMounted(async () => {
  data.value = await getData();
});
</script>