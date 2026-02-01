<template>
  <div class="flex flex-col w-full space-y-4">
    <!-- Instructor Count & Instructor Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount
        icon="hugeicons:teacher"
        :count="data.length"
        label="Total Instructors"
      />
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
      @save="saveInstructorEdits as any"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import DataTable from "../../InstructorDatatable/data-table.vue";
import { getColumns, type Instructor } from "../../InstructorDatatable/columns";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";
import { modalBus } from "@/components/AdminEditInstructorDialog/modalBusEditInstructor";
import AdminEditInstructorDialog from "@/components/AdminEditInstructorDialog/AdminEditInstructorDialog.vue";

// Empty instructor data
const data = ref<Instructor[]>([]);

// Columns for the table
const visibleColumns = computed(() => getColumns("admin"));

// No-op save function just updates the local array safely
const saveInstructorEdits = async (instructor: Instructor) => {
  data.value = data.value.map((i) =>
    i.id === instructor.id ? { ...instructor } : i,
  );
  modalBus.closeEdit();
};
</script>
