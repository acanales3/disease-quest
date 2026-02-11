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

const pageMessage = ref<null | { type: "success" | "error"; text: string }>(null);

const deleteState = ref<
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string }
>({ status: "idle" });

const visibleColumns = computed(() => {
  return getColumns('admin', {
    onRemoveFromClassroom: handleDeleteClick,
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
  // Prefer backend API, fallback to mock.
  try {
    return await $fetch<Student[]>("/api/students");
  } catch {
    return student as unknown as Student[];
  }
}

async function refreshStudents() {
  const students = await fetchStudents();
  data.value = students;
}

async function handleDeleteConfirm(s: Student) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    // Real DB key is UUID (students.user_id). Numeric id being used for display only.
    if (!s.userId) {
      const msg = "Remove-from-classroom failed: backend expects a UUID userId.";
      deleteState.value = { status: "success", message: msg };
      pageMessage.value = { type: "success", text: msg };
      await refreshStudents();
      isDeleteModalOpen.value = false;
      studentToDelete.value = null;
      return;
    }

    if (!s.classroom) {
      throw createError({
        statusCode: 400,
        statusMessage: "Student is not assigned to a classroom.",
      });
    }

    await $fetch(`/api/students/${s.userId}`, {
      method: "DELETE" as any,
      query: { classroomId: s.classroom },
    });

    deleteState.value = { status: "success", message: "Student removed from classroom successfully." };
    pageMessage.value = { type: "success", text: "Student removed from classroom successfully." };

    await refreshStudents();
    isDeleteModalOpen.value = false;
    studentToDelete.value = null;
  } catch (error: any) {
    const statusCode = error?.statusCode ?? error?.data?.statusCode
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage

    const isMissingEndpoint =
      statusCode === 404 || (typeof statusMessage === "string" && statusMessage.includes("Page not found"))

    if (isMissingEndpoint) {
      // Backend not integrated yet so need to simulate so UI can still be tested.
      const msg = "Remove-from-classroom API not available yet (simulated for UI testing)."
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
      "Failed to remove student from classroom.";
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
}

const saveStudentEdits = async (updated: Student) => {
  try {
    if (!updated.userId) {
      throw new Error("Missing userId for student update.");
    }
    // Update backend
    await $fetch(`/api/students/${updated.userId}`, {
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
