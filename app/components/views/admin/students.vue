<template>
  <div class="flex flex-col w-full">
    <!-- Student Count & Student Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:students" :count="data.length" label="Total Students" />
      <InviteDialog dialog-type="student" />
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

const data = ref<Student[]>([]);
const count = ref<number>(0);

const visibleColumns = computed(() => {
  return getColumns('admin');
});

async function getData(): Promise<Student[]> {
    // Fetch data from the API here.
    // For now, we will use the mock student data from the interface.
    return student;
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
    useToast().error("Failed to update student. Please try again.");
  }
};

onMounted(async () => {
    data.value = await getData();
});
</script>
