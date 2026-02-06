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
      :state="deleteState"
      @confirm="handleDeleteConfirm"
      @reset="resetDeleteState"
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
import DeleteClassroomModal from '../../DeleteClassroomModal/DeleteClassroomModal.vue'

const data = ref<Classroom[]>([]);
const isCreateModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const classroomToDelete = ref<Classroom | null>(null);

const pageMessage = ref<null | { type: "success" | "error"; text: string }>(null);

const deleteState = ref<
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string }
>({ status: "idle" });

const visibleColumns = computed(() => {
  return getColumns('admin', {
    onDelete: handleDeleteClick,
  });
});

function resetDeleteState() {
  deleteState.value = { status: "idle" };
}

function handleDeleteClick(classroom: Classroom) {
  pageMessage.value = null;
  classroomToDelete.value = classroom;
  isDeleteModalOpen.value = true;
}

async function handleDeleteConfirm(classroom: Classroom) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    await $fetch(`/api/classrooms/${classroom.id}`, {
      method: "DELETE" as any,
    });

    deleteState.value = { status: "success", message: "Classroom deleted successfully." };
    pageMessage.value = { type: "success", text: `Classroom "${classroom.name}" has been deleted.` };

    await refreshClassrooms();
    isDeleteModalOpen.value = false;
    classroomToDelete.value = null;
  } catch (error: any) {
    const statusCode = error?.statusCode ?? error?.data?.statusCode;
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage;

    const isMissingEndpoint =
      statusCode === 404 || (typeof statusMessage === "string" && statusMessage.includes("Page not found"));

    if (isMissingEndpoint) {
      // Backend not integrated yet — simulate so UI can still be tested.
      const msg = "Delete classroom API not available yet (simulated for UI testing).";
      deleteState.value = { status: "success", message: msg };
      pageMessage.value = { type: "success", text: msg };

      // Remove from local state so the table updates
      data.value = data.value.filter(c => c.id !== classroom.id);
      isDeleteModalOpen.value = false;
      classroomToDelete.value = null;
      return;
    }

    const msg =
      error?.data?.message ||
      statusMessage ||
      "Failed to delete classroom.";
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
}

async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>('/api/classrooms')
  } catch (error) {
    console.error('Failed to fetch classrooms:', error)
    return []
  }
}

async function refreshClassrooms() {
  data.value = await getData();
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