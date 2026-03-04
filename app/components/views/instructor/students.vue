<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Student Management</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Students</h1>
          <p class="text-gray-500 text-[15px] mt-2 leading-relaxed">
            View, invite, and manage students.
          </p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="hugeicons:students" size="15" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ data.length }} students</span>
          </div>
        </div>
        <div class="shrink-0">
          <InviteDialog dialog-type="student" />
        </div>
      </div>
    </div>

    <div v-if="pageMessage">
      <div
        class="flex items-start gap-2.5 text-sm px-4 py-3 rounded-lg border"
        :class="
          pageMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        <Icon
          :name="pageMessage.type === 'success' ? 'lucide:check-circle' : 'lucide:alert-circle'"
          class="text-base mt-0.5 shrink-0"
        />
        {{ pageMessage.text }}
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading students...
    </div>
    <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      {{ loadError }}
    </div>

    <div v-else class="overflow-hidden">
      <DataTable
        :columns="visibleColumns"
        :data="data"
        :classrooms="classrooms"
      />
    </div>

    <DeleteStudentModal
      v-model:open="isDeleteModalOpen"
      :student="studentToDelete"
      mode="unenroll"
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
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";
import DeleteStudentModal from "@/components/DeleteStudentModal/DeleteStudentModal.vue";

import type { Classroom } from "../../ClassroomDatatable/columns";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const data = ref<Student[]>([]);
const classrooms = ref<Classroom[]>([]);

const isDeleteModalOpen = ref(false);
const studentToDelete = ref<Student | null>(null);
const pageMessage = ref<null | { type: "success" | "error"; text: string }>(
  null,
);
const deleteState = ref<DeleteState>({ status: "idle" });
const isLoading = ref(true);
const loadError = ref("");

function resetDeleteState() {
  deleteState.value = { status: "idle" };
}

function handleRemoveFromClassroomClick(s: Student) {
  pageMessage.value = null;
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

const visibleColumns = computed(() => {
  return getColumns("instructor", {
    classrooms: classrooms.value,
    onRemoveFromClassroom: handleRemoveFromClassroomClick,
  });
});

async function getData(): Promise<{
  students: Student[];
  classrooms: Classroom[];
}> {
  const [studentsData, classroomsData] = await Promise.all([
    $fetch<Student[]>("/api/students"),
    $fetch<Classroom[]>("/api/classrooms"),
  ]);
  return { students: studentsData, classrooms: classroomsData };
}

async function refreshStudents() {
  const result = await getData();
  classrooms.value = result.classrooms;

  // Transform classroom IDs into { id, name } objects so the table can display
  // names and the dialog can match them against availableClassrooms.
  data.value = result.students.map((s) => ({
    ...s,
    classrooms: (s.classrooms || []).map((id: any) => {
      const rawId = typeof id === "object" ? id.id : id;
      const match = result.classrooms.find((c) => c.id === rawId);
      return match
        ? { id: match.id, name: match.name }
        : { id: rawId, name: String(rawId) };
    }),
  }));
}

async function handleDeleteConfirm(
  s: Student,
  selectedClassroomIds?: number[],
) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    if (!s.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Remove failed: missing student UUID.",
      });
    }
    if (!selectedClassroomIds || selectedClassroomIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No classrooms selected for removal.",
      });
    }

    await $fetch(`/api/students/${s.userId}`, {
      method: "DELETE" as any,
      query: { classroomIds: selectedClassroomIds.join(",") },
    });

    const classroomNames = selectedClassroomIds
      .map((id) => classrooms.value.find((c) => c.id === id)?.name)
      .filter(Boolean);
    const nameList =
      classroomNames.length > 0
        ? classroomNames.join(", ")
        : `${selectedClassroomIds.length} classroom(s)`;
    const successMessage = `${s.name} has been removed from: ${nameList}.`;

    deleteState.value = { status: "success", message: successMessage };
    pageMessage.value = { type: "success", text: successMessage };

    await refreshStudents();
    isDeleteModalOpen.value = false;
    studentToDelete.value = null;
  } catch (error: any) {
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage;
    const msg =
      error?.data?.message ||
      statusMessage ||
      "Failed to remove student from classroom.";
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
}

onMounted(async () => {
  try {
    loadError.value = "";
    await refreshStudents();
  } catch {
    loadError.value = "Unable to load students at the moment.";
  } finally {
    isLoading.value = false;
  }
});
</script>
