<template>
  <div class="flex flex-col w-full">
    <!-- Student Count & Student Invite -->
    <div class="flex justify-center gap-4">
      <TotalCount icon="hugeicons:students" :count="data.length" label="Total Students" />
      <InviteDialog dialog-type="student" />
    </div>

    <!-- Student Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" :classrooms="classrooms" />
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

import type { Classroom } from "../../ClassroomDatatable/columns"; // Import Classroom type

const data = ref<Student[]>([]);
const classrooms = ref<Classroom[]>([]); // Add classrooms ref

const visibleColumns = computed(() => {
  return getColumns('instructor', {
    classrooms: classrooms.value
  });
});

async function getData(): Promise<{ students: Student[], classrooms: Classroom[] }> {
    const [studentsData, classroomsData] = await Promise.all([
        $fetch<Student[]>("/api/students"),
        $fetch<Classroom[]>("/api/classrooms")
    ]);
    
    return {
        students: studentsData,
        classrooms: classroomsData
    };
}

onMounted(async () => {
    const result = await getData();
    data.value = result.students;
    classrooms.value = result.classrooms;
});
</script>
