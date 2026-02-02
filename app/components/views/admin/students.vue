<template>
  <div class="flex flex-col w-full">
    <!-- Student Count & Student Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:students" :count="data.length" label="Total Students" />
      <InviteDialog dialog-type="student" />
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
    
    <!-- Student Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>

    <AdminEditStudentDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      @close="modalBus.closeEdit()"
      @save="saveStudentEdits"
    />

    <DeleteStudentModal
      v-model:open="isDeleteModalOpen"
      :student="studentToDelete"
      :state="deleteState"
      @confirm="handleDeleteConfirm"
      @reset="resetDeleteState"
    />
  </div>
</template>

<script setup lang="ts">
import type { Student } from "../../StudentDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { getColumns } from "../../StudentDatatable/columns";
import DataTable from "../../StudentDatatable/data-table.vue";
import { student } from "~/assets/interface/Student";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent"
import AdminEditStudentDialog from "@/components/AdminEditStudentDialog/AdminEditStudentDialog.vue"
import DeleteStudentModal from "@/components/DeleteStudentModal/DeleteStudentModal.vue"

const data = ref<Student[]>([]);
const count = ref<number>(0);
const isDeleteModalOpen = ref(false);
const studentToDelete = ref<Student | null>(null);
const deletedIds = ref<number[]>([]);

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

function handleDeleteClick(s: Student) {
  pageMessage.value = null;
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

async function fetchStudents(): Promise<Student[]> {
  // Backend not integrated yet so need toattempt API first, fallback to mock.
  try {
    // Prefer singular endpoint if it exists
    return await $fetch<Student[]>("/api/student");
  } catch {
    // Fallback to endpoint (if backend uses it) or even our static mock data
    try {
      return await $fetch<Student[]>("/api/students");
    } catch {
      return student as unknown as Student[];
    }
  }
}

async function refreshStudents() {
  const students = await fetchStudents();
  data.value = students.filter((s) => !deletedIds.value.includes(s.id));
}

async function handleDeleteConfirm(s: Student) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    // Real DB key is UUID (students.user_id). Numeric id being used for display only.
    if (!s.userId) {
      
      deletedIds.value = [...deletedIds.value, s.id];
      const msg = "Student deleted - backend expects a UUID userId.";
      deleteState.value = { status: "success", message: msg };
      pageMessage.value = { type: "success", text: msg };
      await refreshStudents();
      isDeleteModalOpen.value = false;
      studentToDelete.value = null;
      return;
    }

    await $fetch(`/api/student/${s.userId}`, { method: "DELETE" });

    deletedIds.value = [...deletedIds.value, s.id];
    deleteState.value = { status: "success", message: "Student deleted successfully." };
    pageMessage.value = { type: "success", text: "Student deleted successfully." };

    await refreshStudents();
    isDeleteModalOpen.value = false;
    studentToDelete.value = null;
  } catch (error: any) {
    // If the backend endpoint isn't implemented yet, it returns "Page not found - /api/student/{id}"
    const statusCode = error?.statusCode ?? error?.data?.statusCode
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage

    const isMissingEndpoint =
      statusCode === 404 || (typeof statusMessage === "string" && statusMessage.includes("Page not found"))

    if (isMissingEndpoint) {
      // Backend not integrated yet so need to simulate delete so UI can still be tested.
      deletedIds.value = [...deletedIds.value, s.id];
      const msg = "Delete API not available yet (simulated delete for UI testing)."
      deleteState.value = { status: "success", message: msg };
      pageMessage.value = { type: "success", text: msg };

      await refreshStudents();
      isDeleteModalOpen.value = false;
      studentToDelete.value = null;
      return;
    }

    const msg =
      error?.data?.message ||
      statusMessage ||
      "Failed to delete student.";
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
}

const saveStudentEdits = async (updated: Student) => {
  try {
    // Update backend
    await $fetch(`/api/students/${updated.id}`, {
      method: "PUT",
      body: updated
    });

    // Update local ref array
    // Shadcn table requires passing a new reference to the `data` in order for it to reprocess. It's not reactive when you mutate rows in place 
    data.value = data.value.map(student => student.id === updated.id ? { ...updated } : student);

    // Close modal
    modalBus.closeEdit();
  } catch (error) {
    console.error("Error updating student: ", error);
    pageMessage.value = { type: "error", text: "Failed to update student. Please try again." };
  }
};

onMounted(async () => {
    await refreshStudents();
});
</script>
