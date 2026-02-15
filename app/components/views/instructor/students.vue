<template>
  <div class="flex flex-col w-full">
    <!-- Student Count & Student Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:students" :count="data.length" label="Total Students" />
      <InviteDialog dialog-type="student" />
    </div>

    <!-- Student Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" :classrooms="classrooms"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Student } from "../../StudentDatatable/columns";
import { onMounted, ref, computed } from "vue";
import { getColumns } from "../../StudentDatatable/columns";
import DataTable from "../../StudentDatatable/data-table.vue";

import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

interface ClassroomDropdown {
  id: number
  name: string
}

const data = ref<Student[]>([]);
const classrooms = ref<ClassroomDropdown[]>([])

const visibleColumns = computed(() => {
  return getColumns('instructor');
});

async function getData(): Promise<Student[]> {
    // Fetch data from the API here.
    // For now, we will use the mock student data from the interface.
    return $fetch("/api/students");
}

async function getClassroomSelectors(): Promise<ClassroomDropdown[]> {
  const response = await $fetch<{ classrooms: ClassroomDropdown[] }>(`/api/instructors/classrooms`)
  console.log(response.classrooms)
  return response.classrooms;
}

onMounted(async () => {
    data.value = await getData();
    classrooms.value = await getClassroomSelectors()
});
</script>
