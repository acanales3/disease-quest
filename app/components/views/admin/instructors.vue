<template>
  <div class="flex flex-col w-full">
    <!-- Instructor Count & Instructor Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount
        icon="hugeicons:teacher"
        :count="data.length"
        label="Total Instructors"
      />
      <InviteDialog dialog-type="instructor" />
    </div>

    <!-- Success / Error banner -->
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

    <!-- Instructor Table -->
    <div class="w-full py-2">
      <!-- classrooms passed here + role -->
      <DataTable
        :columns="visibleColumns"
        :data="data"
        :classrooms="classrooms"
        role="instructor"   
      />
    </div>

    <!-- Instructor Edit Modal -->
    <AdminEditInstructorDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      :classrooms="classrooms"
      @close="modalBus.closeEdit()"
      @save="saveInstructorEdits as any"
    />

    <!-- Instructor Delete Modal -->
    <DeleteInstructorModal
      v-model:open="isDeleteModalOpen"
      :instructor="instructorToDelete"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import DataTable from "../../InstructorDatatable/data-table.vue";
import { getColumns, type Instructor } from "@/components/InstructorDatatable/columns";
import type { Classroom } from "../../ClassroomDatatable/columns";

import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";
import { modalBus } from "@/components/AdminEditInstructorDialog/modalBusEditInstructor";
import AdminEditInstructorDialog from "@/components/AdminEditInstructorDialog/AdminEditInstructorDialog.vue";
import DeleteInstructorModal from "@/components/DeleteInstructorModal/DeleteInstructorModal.vue";

// ------------------
// Fetch instructors
// ------------------
const { data, pending, error } = await useFetch<Instructor[]>("/api/instructors", {
  default: () => [],
});

// ------------------
// Classrooms state
// ------------------
const classrooms = ref<Classroom[]>([]);

async function fetchClassrooms() {
  try {
    classrooms.value = await $fetch<Classroom[]>("/api/classrooms");
  } catch {
    classrooms.value = [];
  }
}

onMounted(fetchClassrooms);

// ------------------
// Delete modal state
// ------------------
const isDeleteModalOpen = ref(false);
const instructorToDelete = ref<Instructor | null>(null);

// ------------------
// Page banner message
// ------------------
const pageMessage = ref<null | { type: "success" | "error"; text: string }>(null);

// ------------------
// Delete logic
// ------------------
function handleDeleteClick(instructor: Instructor) {
  pageMessage.value = null;
  instructorToDelete.value = instructor;
  isDeleteModalOpen.value = true;
}

async function handleDeleteConfirm(instructor: Instructor) {
  pageMessage.value = null;

  try {
    const res = await $fetch<any>(`/api/instructors/${instructor.id}`, {
      method: "DELETE",
    });

    data.value = data.value.filter((i) => i.id !== instructor.id);
    instructorToDelete.value = null;

    pageMessage.value = {
      type: "success",
      text: res?.message || "Instructor deleted successfully.",
    };
  } catch (err: any) {
    console.error("Failed to delete instructor:", err?.data || err);

    pageMessage.value = {
      type: "error",
      text:
        err?.data?.message ||
        err?.message ||
        "Failed to delete instructor. Please try again.",
    };
  }
}

// ------------------
// Table columns
// ------------------
const visibleColumns = computed(() =>
  getColumns("admin", {
    onDelete: handleDeleteClick,
  })
);

// ------------------
// Save instructor edits
// ------------------
const saveInstructorEdits = async (instructor: Instructor) => {
  pageMessage.value = null;

  try {
    const [first_name, ...rest] = instructor.name.split(" ");
    const last_name = rest.join(" ");

    await $fetch(`/api/admin/users/${instructor.id}`, {
      method: "PUT",
      body: {
        first_name,
        last_name,
        email: instructor.email,
        school: instructor.school,
        status: instructor.status,
      },
    });

    data.value = data.value.map((i) =>
      i.id === instructor.id ? instructor : i
    );

    modalBus.closeEdit();
  } catch (err: any) {
    console.error("Error updating instructor:", err?.data || err);

    pageMessage.value = {
      type: "error",
      text:
        err?.data?.statusMessage ||
        err?.message ||
        "Failed to update instructor. Please try again.",
    };
  }
};
</script>
