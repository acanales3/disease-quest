<template>
  <div>
    <!-- Student Count & Student Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:students" :count=count label="Total Students" />
      <InviteDialog dialog-type="student" />
    </div>

    <!-- Student Table -->
    <div class="container py-2 mx-auto">
      <DataTable :columns="columns" :data="data"/>
    </div>
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

const data = ref<Student[]>([]);
const count = ref<number>(0);

async function getData(): Promise<Student[]> {
    // Fetch data from the API here.
    // For now, we will use the mock student data from the interface.
    return student;
}

async function getStudentCount(): Promise<number> {
  return 153;
}

onMounted(async () => {
    data.value = await getData();
    count.value = await getStudentCount();
});
</script>
