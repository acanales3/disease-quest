<template>
  <div class="flex flex-col w-full">
    <!-- Student Count & Student Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:students" :count="data.length" label="Total Students" />
      <InviteDialog dialog-type="student" />
    </div>
    
    <!-- Student Table -->
    <div class="w-full py-2">
      <DataTable :columns="columns" :data="data" />
    </div>

    <AdminEditStudentDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      @close="modalBus.closeEdit()"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import type { Student } from "../../StudentDatatable/columns";
import { onMounted, ref } from "vue";
import { columns } from "../../StudentDatatable/columns";
import DataTable from "../../StudentDatatable/data-table.vue";
import { student } from "~/assets/interface/Student";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent"
import AdminEditStudentDialog from "@/components/AdminEditStudentDialog/AdminEditStudentDialog.vue"

const data = ref<Student[]>([]);
const count = ref<number>(0);

async function getData(): Promise<Student[]> {
    // Fetch data from the API here.
    // For now, we will use the mock student data from the interface.
    return student;
}

onMounted(async () => {
    data.value = await getData();
});
</script>
