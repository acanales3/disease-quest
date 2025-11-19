<template>
  <div class="flex flex-col w-full">
    
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Classrooms"
        icon="simple-icons:googleclassroom"
      />
      
      <Button
        variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4"
        @click="openCreateModal"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="ic:baseline-add" size="28" class="#ad46ff" />
          <span class="text-sm">Create Classroom</span>
        </div>
      </Button>
    </div>

    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>

    <CreateClassroomModal 
      v-model:open="isCreateModalOpen" 
      @created="handleClassroomCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { getColumns } from "../../ClassroomDatatable/columns";
import { classrooms } from "../../../assets/interface/Classroom";
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref, computed } from 'vue'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'
import { Button } from '../../ui/button'
import { Icon } from '#components'
import CreateClassroomModal from '../../CreateClassroomModal/CreateClassroomModal.vue'

const data = ref<Classroom[]>([]);
const isCreateModalOpen = ref(false);

const visibleColumns = computed(() => {
  const columnsToShow = [
    "id",
    "name",
    "code",
    "section",
    "startDate",
    "endDate",
    "status",
    "actions",
  ];
  return getColumns('instructor').filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

async function getData(): Promise<Classroom[]> {
  // Fetch data from your API here.
  return classrooms;
}

function openCreateModal() {
  isCreateModalOpen.value = true;
}

function handleClassroomCreated(classroom: any) {
  console.log('Classroom created:', classroom);
  // data.value = await getData();
}

onMounted(async () => {
  data.value = await getData();
});
</script>