<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Content</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Classrooms</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            View, create, edit, and manage classrooms.
          </p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="simple-icons:googleclassroom" size="15" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ data.length }} classrooms</span>
          </div>
        </div>

        <Button
          class="bg-[#4d1979] hover:bg-[#3f1564] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 shrink-0"
          @click="openCreateModal"
        >
          <Icon name="lucide:plus" size="15" />
          Create Classroom
        </Button>
      </div>
    </div>

    <!-- Success / invite-code banner -->
    <div v-if="pageMessage">
      <div
        class="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
        :class="
          pageMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        <Icon :name="pageMessage.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'" size="15" />
        {{ pageMessage.text }}
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading classrooms...
    </div>

    <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      {{ loadError }}
    </div>

    <div v-else class="w-full">
      <DataTable
        :columns="visibleColumns"
        :data="data"
        user-role="instructor"
      />
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
const isLoading = ref(true);
const loadError = ref("");

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
    const firstName = profile.first_name ?? "";
    const lastName = profile.last_name ?? "";
    currentUser.value = {
      id: profile.id ?? "",
      // Concatenate first_name and last_name since the User interface
      // has no guaranteed `name` field
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" "),
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
  try {
    loadError.value = "";
    await fetchCurrentUser();
    data.value = await getData();
  } catch {
    loadError.value = "Unable to load classrooms right now.";
  } finally {
    isLoading.value = false;
  }
});
</script>
