<template>
  <div class="flex flex-col justify-start w-full gap-4">
    <!-- Greeting Card -->
    <div
      class="rounded-lg text-center flex flex-col items-center justify-center w-full bg-white shadow-sm py-6"
    >
      <h1 class="text-lg font-bold text-gray-800">Hey {{ userName }}!</h1>
      <p class="text-sm text-gray-500">Welcome back to DiseaseQuest!</p>
    </div>

    <!-- Stats Row -->
    <div class="flex w-full justify-between items-center gap-4 my-6">
      <TotalCount 
        icon="hugeicons:students" 
        :count="dashboardData?.totalStudents" 
        label="Students" 
      />

      <TotalCount
        icon="simple-icons:googleclassroom"
        :count="dashboardData?.totalClassrooms"
        label="Classrooms"
      />

      <TotalCount
        icon="si:book-line"
        :count="dashboardData?.totalCases"
        label="Cases"
      />

      <PieChart
        header="Student Participation"
        index="name"
        :category="'total'"
        :data="graphData"
        :type="'donut'"
        :categories="['Registered', 'Unregistered']"
      />
    </div>

    <!-- Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" :row-length="5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PieChart from "../../PieChart/pie-chart.vue";

import { getColumns } from "../../ClassroomDatatable/columns";
import DataTable from "../../ClassroomDatatable/data-table.vue";
import { classrooms } from "../../../assets/interface/Classroom";
import type { Classroom } from "../../ClassroomDatatable/columns";
import TotalCount from "@/components/ui/TotalCount.vue";
import { onMounted, ref, computed } from "vue";

export interface InstructorDashboard {
  instructorName: string;
  totalStudents: number;
  totalClassrooms: number;
  totalCases: number;
  totalInvitations: number;
}

const graphData = ref([
  { name: "Registered", total: 0 },
  { name: "Unregistered", total: 0 },
]);

const userName = ref('')

const data = ref<Classroom[]>([]);
const dashboardData = ref<InstructorDashboard>();

const visibleColumns = computed(() => {
  const columnsToShow = [
    "id",
    "name",
    "code",
    "section",
    "startDate",
    "endDate",
    "status",
    "actions",
  ];
  return getColumns('instructor').filter(column => {
    const key = 'id' in column ? column.id : 'accessorKey' in column ? column.accessorKey : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

async function getData(): Promise<Classroom[]> {
  try {
    return await $fetch<Classroom[]>('/api/classrooms')
  } catch (error) {
    console.error('Failed to fetch classrooms:', error)
    return []
  }
}

async function getDashboardData(): Promise<InstructorDashboard>{
  return await $fetch('/api/instructors/dashboard')
}

onMounted(async () => {
  try {
    dashboardData.value = await getDashboardData();

    if (!dashboardData.value) return;
    userName.value = dashboardData.value.instructorName;
    graphData.value[0].total = dashboardData.value.totalStudents;
    graphData.value[1].total = dashboardData.value.totalInvitations - dashboardData.value.totalStudents;

    data.value = await getData();
  } catch (error) {
    console.error("Failed to fetch instructor's dashboard data:", error)
  }
});
</script>
