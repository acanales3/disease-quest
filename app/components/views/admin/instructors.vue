<template>
  <div class="flex flex-col w-full">
    <!-- Instructor Count & Instructor Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:teacher" :count="data.length" label="Total Instructors" />
      <InviteDialog dialog-type="instructor" />
    </div>

    <!-- Instructor Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>

    <!-- Instructor Edit Modal -->
    <AdminEditInstructorDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      @close="modalBus.closeEdit()"
      @save="saveInstructorEdits"
    />
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from "../../InstructorDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { getColumns } from "../../InstructorDatatable/columns";
import DataTable from "../../InstructorDatatable/data-table.vue";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

import { modalBus } from "@/components/AdminEditInstructorDialog/modalBusEditInstructor"
import AdminEditInstructorDialog from "@/components/AdminEditInstructorDialog/AdminEditInstructorDialog.vue"

const data = ref<Instructor[]>([]);

const visibleColumns = computed(() => {
  return getColumns('admin');
});

async function getData(): Promise<Instructor[]> {
  try {
    return await $fetch<Instructor[]>("/api/instructor");
  } catch {
    // Support older naming if present.
    try {
      return await $fetch<Instructor[]>("/api/instructors");
    } catch (error) {
      console.error("Failed to fetch instructors:", error);
      return [];
    }
  }
}

const saveInstructorEdits = async (updated: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  classroom: number | null;
  status: "active" | "deactivated";
}) => {
  try {
    // Update backend (existing endpoint is singular)
    await $fetch(`/api/instructor/${updated.id}`, {
      method: "PUT",
      body: updated,
    });

    // Update local ref array
    // Shadcn table requires passing a new reference to the `data` in order for it to reprocess. It's not reactive when you mutate rows in place.
    const fullName = `${updated.first_name} ${updated.last_name}`.trim();
    data.value = data.value.map((instructor) =>
      instructor.userId === updated.id
        ? {
            ...instructor,
            first_name: updated.first_name,
            last_name: updated.last_name,
            name: fullName || instructor.name,
            email: updated.email,
            school: updated.school,
            classroom: updated.classroom ?? instructor.classroom,
            status: updated.status,
          }
        : instructor
    );

    // Close modal
    modalBus.closeEdit();
  } catch (error) {
    console.error("Error updating instructor: ", error);
  }
};

onMounted(async () => {
  data.value = await getData();
});
</script>
