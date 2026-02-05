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
      :data="editFormData"
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
import type { InstructorEdit } from "~/assets/interface/InstructorEdit";

// Empty instructor data
const { data, pending, error } = await useFetch<Instructor[]>('/api/instructors', {
  default: () => [],
})

watchEffect(() => {
  console.log('🧠 instructors data:', data.value)
  console.log('⏳ pending:', pending.value)
  console.log('💥 error:', error.value)
})

// Columns for the table
const visibleColumns = computed(() => getColumns("admin"));

const editFormData = computed<InstructorEdit | null>(() => {
  if (!modalBus.editData) return null;

  const i = modalBus.editData;

  return {
    id: i.id,
    first_name: i.first_name,
    last_name: i.last_name,
    email: i.email,
    school: i.school,
    classroom: i.classroom,
    status: i.status as 'active' | 'deactivated',
  };
});

// No-op save function just updates the local array safely
const saveInstructorEdits = async (instructor: InstructorEdit) => {
  await $fetch(`/api/instructors/${instructor.id}`, {
    method: 'PUT',
    body: {
      first_name: instructor.first_name,
      last_name: instructor.last_name, 
      email: instructor.email,
      school: instructor.school,
      status: instructor.status
    },
  })

  data.value = data.value.map((i) =>
    i.id === instructor.id
    ? {
      ...i,
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      name: `${instructor.first_name} ${instructor.last_name}`,
      email: instructor.email,
      school: instructor.school,
      status: instructor.status
    }
    : i,
  )
  modalBus.closeEdit();
};
</script>
