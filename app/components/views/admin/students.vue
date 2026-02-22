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
      <DataTable :columns="visibleColumns" :data="data" :classrooms="classrooms" />
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
      :mode="deleteMode"
      :state="deleteState"
      :available-classrooms="classrooms"
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

import type { Classroom } from "../../ClassroomDatatable/columns"; // Import Classroom type

const data = ref<Student[]>([]);
const classrooms = ref<Classroom[]>([]); // Add classrooms ref
const count = ref<number>(0);
const isDeleteModalOpen = ref(false);
const studentToDelete = ref<Student | null>(null);
const deleteMode = ref<"delete" | "unenroll">("delete");

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
    onRemoveFromClassroom: handleRemoveFromClassroomClick,
    classrooms: classrooms.value,
  });
});

function resetDeleteState() {
  deleteState.value = { status: "idle" };
}

function handleDeleteClick(s: Student) {
  pageMessage.value = null;
  deleteMode.value = "delete";
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

function handleRemoveFromClassroomClick(s: Student) {
  pageMessage.value = null;
  deleteMode.value = "unenroll";
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

async function fetchStudents(): Promise<{ students: Student[], classrooms: Classroom[] }> {
  // Prefer backend API, fallback to mock.
  try {
    const [studentsData, classroomsData] = await Promise.all([
      $fetch<Student[]>("/api/students"),
      $fetch<Classroom[]>("/api/classrooms")
    ]);
    return { students: studentsData, classrooms: classroomsData };
  } catch {
    return { students: student as unknown as Student[], classrooms: [] };
  }
}

async function refreshStudents() {
  const result = await fetchStudents();
  data.value = result.students;
  classrooms.value = result.classrooms;
}

async function handleDeleteConfirm(s: Student, selectedClassroomIds?: number[]) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    if (!s.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Delete failed: missing student UUID (userId).",
      });
    }
    if (deleteMode.value === "unenroll") {
      if (!selectedClassroomIds || selectedClassroomIds.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: "No classrooms selected for removal.",
        });
      }
    }

    await $fetch(`/api/students/${s.userId}`, {
      method: "DELETE" as any,
      query: deleteMode.value === "unenroll"
        ? { classroomIds: selectedClassroomIds!.join(",") }
        : undefined,
    });

    let successMessage: string;
    if (deleteMode.value === "unenroll") {
      const classroomNames = selectedClassroomIds!
        .map((id) => classrooms.value.find((c) => c.id === id)?.name)
        .filter(Boolean);
      const nameList = classroomNames.length > 0 ? classroomNames.join(", ") : `${selectedClassroomIds!.length} classroom(s)`;
      successMessage = `${s.name} has been removed from: ${nameList}.`;
    } else {
      successMessage = "Student deleted successfully.";
    }
    deleteState.value = { status: "success", message: successMessage };
    pageMessage.value = { type: "success", text: successMessage };

    await refreshStudents();
    isDeleteModalOpen.value = false;
    studentToDelete.value = null;
  } catch (error: any) {
    const statusCode = error?.statusCode ?? error?.data?.statusCode
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage

    const isMissingEndpoint =
      typeof statusMessage === "string" && statusMessage.includes("Page not found")

    if (isMissingEndpoint) {
      const msg =
        deleteMode.value === "unenroll"
          ? "Remove-from-classroom API not available yet (simulated for UI testing)."
          : "Delete-student API not available yet (simulated for UI testing)."
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
      (deleteMode.value === "unenroll"
        ? "Failed to remove student from classroom."
        : "Failed to delete student.");
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
}

const saveStudentEdits = async (updated: Student) => {
  try {
    if (!updated.userId) {
      throw new Error("Missing userId for student update.");
    }

    // Split name into first/last for the admin endpoint
    const [first_name, ...rest] = (updated.name ?? "").split(" ");
    const last_name = rest.join(" ");

    // 1. Update user-level fields via the admin endpoint
    await $fetch(`/api/admin/users/${updated.userId}`, {
      method: "PUT",
      body: {
        first_name,
        last_name,
        email: updated.email,
        school: updated.school,
        status: updated.status,
      },
    });

    // 2. Update student-specific fields (nickname, msyear, classroom)
    //    via the existing student endpoint
    await $fetch(`/api/students/${updated.userId}`, {
      method: "PUT",
      body: updated,
    });

    // Update local ref array
    // Shadcn table requires passing a new reference to the `data` in order for it to reprocess. It's not reactive when you mutate rows in place
    data.value = data.value.map(student => student.id === updated.id ? { ...updated } : student);

    // Close modal
    modalBus.closeEdit();
  } catch (error: any) {
    console.error("Error updating student:", error?.data || error);
    pageMessage.value = {
      type: "error",
      text:
        error?.data?.statusMessage ||
        error?.message ||
        "Failed to update student. Please try again.",
    };
  }
};

onMounted(async () => {
    await refreshStudents();
});
</script>
