<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Student Management</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Students</h1>
          <p class="text-gray-500 text-[15px] mt-2 leading-relaxed">View, invite, edit, and manage students.</p>
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

    <!-- Success / Error banner -->
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

    <!-- Student Table -->
    <div class="overflow-hidden">
      <DataTable
        :columns="visibleColumns"
        :data="data"
        :classrooms="classrooms"
      />
    </div>

    <AdminEditStudentDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      :classrooms="classrooms"
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

import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent";
import AdminEditStudentDialog from "@/components/AdminEditStudentDialog/AdminEditStudentDialog.vue";
import DeleteStudentModal from "@/components/DeleteStudentModal/DeleteStudentModal.vue";

import type { Classroom } from "../../ClassroomDatatable/columns";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type PageMessage = { type: "success" | "error"; text: string };

const data = ref<Student[]>([]);
const classrooms = ref<Classroom[]>([]);
const count = ref<number>(0);
const isDeleteModalOpen = ref(false);
const studentToDelete = ref<Student | null>(null);
const deleteMode = ref<"delete" | "unenroll">("delete");
const pageMessage = ref<PageMessage | null>(null);
const deleteState = ref<DeleteState>({ status: "idle" });

const visibleColumns = computed(() => {
  return getColumns("admin", {
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

async function fetchStudents(): Promise<{
  students: Student[];
  classrooms: Classroom[];
}> {
  try {
    const [studentsData, classroomsData] = await Promise.all([
      $fetch<Student[]>("/api/students"),
      $fetch<Classroom[]>("/api/classrooms"),
    ]);
    return { students: studentsData, classrooms: classroomsData };
  } catch {
    return { students: student as unknown as Student[], classrooms: [] };
  }
}

async function refreshStudents() {
  const result = await fetchStudents();
  classrooms.value = result.classrooms;

  // Store classrooms as { id, name } objects so the table can display names.
  // The dialog will extract ids from these objects for matching.
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
      query:
        deleteMode.value === "unenroll"
          ? { classroomIds: selectedClassroomIds!.join(",") }
          : undefined,
    });

    let successMessage: string;
    if (deleteMode.value === "unenroll") {
      const classroomNames = selectedClassroomIds!
        .map((id) => classrooms.value.find((c) => c.id === id)?.name)
        .filter(Boolean);
      const nameList =
        classroomNames.length > 0
          ? classroomNames.join(", ")
          : `${selectedClassroomIds!.length} classroom(s)`;
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
    const statusMessage = error?.statusMessage ?? error?.data?.statusMessage;

    const isMissingEndpoint =
      typeof statusMessage === "string" &&
      statusMessage.includes("Page not found");

    if (isMissingEndpoint) {
      const msg =
        deleteMode.value === "unenroll"
          ? "Remove-from-classroom API not available yet (simulated for UI testing)."
          : "Delete-student API not available yet (simulated for UI testing).";
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

    await $fetch(`/api/admins/users/${updated.userId}`, {
      method: "PUT",
      body: {
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        school: updated.school,
        status: updated.status,
      },
    });

    await $fetch(`/api/students/${updated.userId}`, {
      method: "PUT",
      body: updated,
    });

    // Shadcn table requires passing a new reference to `data` to reprocess.
    // It's not reactive when you mutate rows in place.
    data.value = data.value.map((s) =>
      s.userId === updated.userId ? { ...s, ...updated } : s,
    );

    modalBus.closeEdit();
    refreshStudents();
    pageMessage.value = {
      type: "success",
      text: `Successfully updated ${updated.first_name} ${updated.last_name}`,
    };

    setTimeout(() => {
      pageMessage.value = null;
    }, 5000);
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
