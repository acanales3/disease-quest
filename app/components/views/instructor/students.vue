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

    <DeleteStudentModal
      v-model:open="isDeleteModalOpen"
      :student="studentToDelete"
      :mode="deleteMode"
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

import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";
import DeleteStudentModal from "@/components/DeleteStudentModal/DeleteStudentModal.vue"

import type { Classroom } from "../../ClassroomDatatable/columns"; // Import Classroom type

const data = ref<Student[]>([]);
const classrooms = ref<Classroom[]>([]); // Add classrooms ref

const deleteMode = ref<"delete" | "unenroll">("unenroll") // instructors may only unenroll students
const isDeleteModalOpen = ref(false)
const studentToDelete = ref<Student | null>(null)

const pageMessage = ref<null | { type: "success" | "error"; text: string }>(null);

const deleteState = ref<
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string }
>({ status: "idle" });

const visibleColumns = computed(() => {
  return getColumns('instructor', {
    onRemoveFromClassroom: handleRemoveFromClassroomClick
  });
});

function resetDeleteState() {
  deleteState.value = { status: "idle" };
}

async function getData(): Promise<{ students: Student[], classrooms: Classroom[] }> {
    const [studentsData, classroomsData] = await Promise.all([
        $fetch<Student[]>("/api/students"),
        $fetch<Classroom[]>("/api/classrooms")
    ]);
    
    return {
        students: studentsData,
        classrooms: classroomsData
    };
}

async function refreshStudents() {
  const result = await getData();
  data.value = result.students;
  classrooms.value = result.classrooms;
}

function handleRemoveFromClassroomClick(s: Student) {
  pageMessage.value = null;
  deleteMode.value = "unenroll";
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

async function handleDeleteConfirm(s: Student) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    // Real DB key is UUID (students.user_id). Numeric id is only for datatable display.
    if (!s.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Delete failed: missing student UUID (userId).",
      });
    }
    if (deleteMode.value === "unenroll" && (!s.classroom || Number(s.classroom) <= 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Student is not currently assigned to a classroom.",
      });
    }

    await $fetch(`/api/students/${s.userId}`, {
      method: "DELETE" as any,
      query: deleteMode.value === "unenroll" ? { classroomId: s.classroom } : undefined,
    });

    const successMessage = "Student removed from classroom successfully."
    deleteState.value = { status: "success", message: successMessage };
    pageMessage.value = { type: "success", text: successMessage };

    await refreshStudents();
    isDeleteModalOpen.value = false;
    studentToDelete.value = null;
    setTimeout(() => {
      pageMessage.value = null;
    }, 4000)
  } catch (error: any) {
    const statusCode = error?.statusCode ?? error?.data?.statusCode
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage

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

onMounted(async () => {
    const result = await getData();
    data.value = result.students;
    classrooms.value = result.classrooms;
});
</script>
