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
      <DataTable
        :columns="visibleColumns"
        :data="data"
        @edit="handleEditClassroom"
      />
    </div>

    <CreateClassroomModal 
      v-model:open="isCreateModalOpen" 
      @created="handleClassroomCreated"
    />

    <EditClassroomModal
      v-model:open="isEditModalOpen"
      :classroom="selectedClassroom"
      @updated="handleClassroomUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { getColumns } from "../../ClassroomDatatable/columns";
import type { Classroom } from "../../ClassroomDatatable/columns";
import { onMounted, ref, computed } from "vue";
import DataTable from "../../ClassroomDatatable/data-table.vue";
import TotalCount from "../../ui/TotalCount.vue";
import { Button } from "../../ui/button";
import { Icon } from "#components";
import CreateClassroomModal from "../../CreateClassroomModal/CreateClassroomModal.vue";
import EditClassroomModal from "../../EditClassroomModal/EditClassroomModal.vue";

const data = ref<Classroom[]>([]);
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedClassroom = ref<Classroom | null>(null);

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
  return getColumns("instructor", {
    onEdit: handleEditClassroom,
  }).filter((column) => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
          ? column.accessorKey
          : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>("/api/classrooms");
  } catch (error) {
    console.error("Failed to fetch classrooms:", error);
    return [];
  }
}

function openCreateModal() {
  isCreateModalOpen.value = true;
}

function handleEditClassroom(classroom: Classroom) {
  selectedClassroom.value = classroom;
  isEditModalOpen.value = true;
}

function handleClassroomCreated(classroom: any) {
  console.log("Classroom created:", classroom);
  // data.value = await getData();
  
  // Will likely need to replace this once api is ready
  const newClassroom = {
    id: data.value.length + 1,
    ...classroom,
  };

  data.value = [...data.value, newClassroom];
  isCreateModalOpen.value = false;
}

function handleClassroomUpdated(updatedClassroom: Classroom) {
  data.value = data.value.map((classroom) =>
    String(classroom.id) === String(updatedClassroom.id)
      ? { ...classroom, ...updatedClassroom }
      : classroom
  );
  selectedClassroom.value = updatedClassroom;
  isEditModalOpen.value = false;
}

onMounted(async () => {
  data.value = await getData();
});
</script>
