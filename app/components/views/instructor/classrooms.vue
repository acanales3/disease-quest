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

    <!-- Success / invite-code banner -->
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
      <DataTable
        :columns="visibleColumns"
        :data="data"
        @edit="handleEditClassroom"
      />
    </div>

    <CreateClassroomModal 
      v-model:open="isCreateModalOpen" 
      @created="handleClassroomCreated"
      @cancel="handleCancel"
    />

    <EditClassroomModal
      v-model:open="isEditModalOpen"
      :classroom="selectedClassroom"
      @updated="handleClassroomUpdated"
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
import type { Classroom } from '../../ClassroomDatatable/columns'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../../ClassroomDatatable/data-table.vue'
import TotalCount from '../../ui/TotalCount.vue'
import { Button } from '../../ui/button'
import { Icon } from '#components'
import CreateClassroomModal from '../../CreateClassroomModal/CreateClassroomModal.vue'
import EditClassroomModal from '../../EditClassroomModal/EditClassroomModal.vue'
import DeleteClassroomModal from '../../DeleteClassroomModal/DeleteClassroomModal.vue'

const router = useRouter();
const data = ref<Classroom[]>([]);
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedClassroom = ref<Classroom | null>(null);
const classroomToDelete = ref<Classroom | null>(null);

const pageMessage = ref<null | { type: "success" | "error"; text: string }>(null);

const deleteState = ref<
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string }
>({ status: "idle" });

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
    onDelete: handleDeleteClick,
  }).filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>('/api/classrooms')
  } catch (error) {
    console.error('Failed to fetch classrooms:', error)
    return []
  }
}

function openCreateModal() {
  pageMessage.value = null;
  isCreateModalOpen.value = true;
}

function handleEditClassroom(classroom: Classroom) {
  selectedClassroom.value = classroom;
  isEditModalOpen.value = true;
}

function handleClassroomCreated(response: { id: number; inviteCode: string; [key: string]: any }) {
  isCreateModalOpen.value = false;

  // Navigate to the new Classroom Overview and show invite code via query param
  router.push({
    path: `/instructor/classrooms/${response.id}`,
    query: { inviteCode: response.inviteCode },
  });
}

function handleCancel() {
  // On cancel: stay on the current classrooms page (no submission)
  isCreateModalOpen.value = false;
}

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

    data.value = await getData();
    isDeleteModalOpen.value = false;
    classroomToDelete.value = null;
  } catch (error: any) {
    const msg =
      error?.data?.message ||
      error?.statusMessage ||
      "Failed to delete classroom.";
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
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
