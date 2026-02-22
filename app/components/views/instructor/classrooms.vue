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
        :class="
          pageMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        {{ pageMessage.text }}
      </div>
    </div>

    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" user-role="instructor" />
    </div>

    <CreateClassroomModal
      v-model:open="isCreateModalOpen"
      user-role="INSTRUCTOR"
      :current-instructor-id="currentUser.id"
      :current-instructor-name="currentUser.name"
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
import type { Classroom } from "../../ClassroomDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import DataTable from "../../ClassroomDatatable/data-table.vue";
import TotalCount from "../../ui/TotalCount.vue";
import { Button } from "../../ui/button";
import { Icon } from "#components";
import CreateClassroomModal from "../../CreateClassroomModal/CreateClassroomModal.vue";
import EditClassroomModal from "../../EditClassroomModal/EditClassroomModal.vue";
import DeleteClassroomModal from "../../DeleteClassroomModal/DeleteClassroomModal.vue";
import useSupabaseAuth from "~/composables/useSupabaseAuth";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const router = useRouter();
const { fetchCustomUser } = useSupabaseAuth();

const data = ref<Classroom[]>([]);
const isCreateModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const selectedClassroom = ref<Classroom | null>(null);
const classroomToDelete = ref<Classroom | null>(null);

const currentUser = ref<{ id: string; name: string }>({ id: "", name: "" });
const pageMessage = ref<{ type: "success" | "error"; text: string } | null>(
  null,
);
const deleteState = ref<DeleteState>({ status: "idle" });

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

async function fetchCurrentUser() {
  const profile = await fetchCustomUser();
  if (profile) {
    currentUser.value = {
      id: profile.id ?? "",
      name: profile.name ?? "",
    };
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

function handleClassroomCreated(response: {
  id: number;
  inviteCode: string;
  [key: string]: any;
}) {
  isCreateModalOpen.value = false;
  router.push({
    path: `/instructor/classrooms/${response.id}`,
    query: { inviteCode: response.inviteCode },
  });
}

function handleCancel() {
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

    deleteState.value = {
      status: "success",
      message: "Classroom deleted successfully.",
    };
    pageMessage.value = {
      type: "success",
      text: `Classroom "${classroom.name}" has been deleted.`,
    };

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
      : classroom,
  );
  selectedClassroom.value = updatedClassroom;
  isEditModalOpen.value = false;
}

onMounted(async () => {
  await fetchCurrentUser();
  data.value = await getData();
});
</script>
