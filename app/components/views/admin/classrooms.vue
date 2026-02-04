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

    <div v-if="pageMessage" class="w-full py-2">
      <div
        class="rounded-md border px-4 py-3 text-sm"
        :class="pageMessage.type === 'success'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-700'"
      >
        {{ pageMessage.text }}
      </div>
    </div>

    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>

    <CreateClassroomModal 
      v-model:open="isCreateModalOpen" 
      @created="handleClassroomCreated"
    />

    <DeleteClassroomModal
      v-model:open="isDeleteModalOpen"
      :classroom="classroomToDelete"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { getColumns } from "../../ClassroomDatatable/columns";
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref, computed } from 'vue'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'
import { Button } from '../../ui/button'
import { Icon } from '#components'
import CreateClassroomModal from '../../CreateClassroomModal/CreateClassroomModal.vue'
import DeleteClassroomModal from '../../DeleteClassroomModal/DeleteClassroomModal.vue'

const data = ref<Classroom[]>([]);
const isCreateModalOpen = ref(false);
const isLoading = ref(false);

const isDeleteModalOpen = ref(false);
const classroomToDelete = ref<Classroom | null>(null);
const pageMessage = ref<null | { type: "success" | "error"; text: string }>(null);

function handleDeleteClick(classroom: Classroom) {
  pageMessage.value = null;
  classroomToDelete.value = classroom;
  isDeleteModalOpen.value = true;
}

const visibleColumns = computed(() => {
  return getColumns('admin', {
    onDelete: handleDeleteClick,
  });
});

async function fetchClassrooms() {
  isLoading.value = true;
  try {
    const classrooms = await $fetch<Classroom[]>('/api/classrooms');
    data.value = classrooms;
  } catch (error) {
    console.error('Failed to fetch classrooms:', error);
    pageMessage.value = { type: "error", text: "Failed to fetch classrooms." };
  } finally {
    isLoading.value = false;
  }
}

function openCreateModal() {
  isCreateModalOpen.value = true;
}

async function handleClassroomCreated(classroom: any) {
  console.log('Classroom created:', classroom);
  // Refresh the list after creating a new classroom
  await fetchClassrooms();
}

async function handleDeleteConfirm(classroom: Classroom) {
  pageMessage.value = null;
  try {
    await $fetch(`/api/classroom/${classroom.id}`, { method: "DELETE" });
    pageMessage.value = { type: "success", text: "Classroom deleted successfully." };
    await fetchClassrooms();
  } catch (error: any) {
    const statusCode = error?.statusCode ?? error?.data?.statusCode;
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage;
    const isMissingEndpoint =
      statusCode === 404 || (typeof statusMessage === "string" && statusMessage.includes("Page not found"));

    if (isMissingEndpoint) {
      // If backend delete isn't wired (or endpoint differs), at least keep UI usable.
      data.value = data.value.filter((c) => c.id !== classroom.id);
      pageMessage.value = { type: "success", text: "Delete API not available yet (simulated delete for UI testing)." };
      return;
    }

    const msg =
      error?.data?.message ||
      statusMessage ||
      "Failed to delete classroom.";
    pageMessage.value = { type: "error", text: msg };
  } finally {
    isDeleteModalOpen.value = false;
    classroomToDelete.value = null;
  }
}

onMounted(async () => {
  await fetchClassrooms();
});
</script>