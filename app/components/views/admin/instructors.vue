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
import { instructors } from "../../../assets/interface/Instructor";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

import { modalBus } from "@/components/AdminEditInstructorDialog/modalBusEditInstructor"
import AdminEditInstructorDialog from "@/components/AdminEditInstructorDialog/AdminEditInstructorDialog.vue"

const data = ref<Instructor[]>([]);

const visibleColumns = computed(() => {
  return getColumns('admin');
});

async function getData(): Promise<Instructor[]> {
  // Fetch data from your API here.
  return instructors;
}

const saveInstructorEdits = async (updated: Instructor) => {
  try {
    // Update backend
    /* await $fetch(`/api/instructors/${updated.id}`, {
      method: "PUT",
      body: updated
    }); */

    // Update local ref array
    // Shadcn table requires passing a new reference to the `data` in order for it to reprocess. It's not reactive when you mutate rows in place.
    data.value = data.value.map(instructor => instructor.id === updated.id ? { ...updated } : instructor);

    // Close modal
    modalBus.closeEdit();
  } catch (error) {
    console.error("Error updating instructor: ", error);
    useToast().error("Failed to update instructor. Please try again.");
  }
};

onMounted(async () => {
  data.value = await getData();
});
</script>
