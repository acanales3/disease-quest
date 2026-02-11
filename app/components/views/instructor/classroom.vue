<template>
  <div class="space-y-10">
    <!-- CLASSROOM DETAILS -->
    <div v-if="classroom" class="bg-white shadow rounded p-8 text-center">
      <h1 class="text-2xl font-bold mb-6 text-gray-900">
        {{ classroom.name }}
      </h1>

      <div class="grid grid-cols-3 gap-y-6 gap-x-10 max-w-6xl mx-auto text-gray-700">
        <div>
          <div class="font-semibold">Code</div>
          <div>{{ classroom.code }}</div>
          <div class="font-semibold mt-2">Section</div>
          <div>{{ classroom.section }}</div>
        </div>

        <div>
          <div class="font-semibold">Start Date</div>
          <div>{{ classroom.startDate }}</div>
          <div class="font-semibold mt-2">End Date</div>
          <div>{{ classroom.endDate }}</div>
        </div>

        <div>
          <div class="font-semibold">Status</div>
          <span
            :class="{
              'text-green-600': classroom.status === 'active',
              'text-red-600': classroom.status === 'inactive',
            }"
          >
            {{ classroom.status }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">
      Classroom not found.
    </div>

    <!-- CASES TABLE -->
    <div class="w-full py-2">
      <CaseDataTable :columns="caseColumns" :data="caseData" />
    </div>

    <!-- STUDENT TABLE -->
    <div class="w-full py-2">
      <StudentDataTable :columns="studentColumns" :data="studentData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

/* classroom */
import { classrooms, type Classroom } from "~/assets/interface/Classroom";

/* students */
import type { Student } from "../../StudentDatatable/columns";
import { getColumns as getStudentColumns } from "../../StudentDatatable/columns";
import StudentDataTable from "../../StudentDatatable/data-table.vue";
import { student } from "~/assets/interface/Student";

/* cases */
import type { Case } from "../../CaseDatatable/columns";
import { getColumns as getCaseColumns } from "../../CaseDatatable/columns";
import CaseDataTable from "../../CaseDatatable/data-table.vue";
import { cases } from "~/assets/interface/Case";

const route = useRoute();
const classroomId = Number(route.params.classroomId);

const classroom: Classroom | undefined = classrooms.find(
  c => c.id === classroomId
);

/* ===== STUDENTS ===== */
const studentData = ref<Student[]>([]);
const studentColumns = computed(() => getStudentColumns("instructor"));

async function getStudents(): Promise<Student[]> {
  try {
    const data = await $fetch(`/api/classrooms/${classroomId}/students`);
    return data.map((s: any) => ({
      id: s.id as unknown as number, // Cast to number to satisfy interface, though it's a UUID string
      name: s.name,
      email: s.email,
      school: s.school || "", 
      msyear: s.msyear,
      classroom: classroomId,
      status: s.status,
    }));
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return [];
  }
}

/* ===== CASES ===== */
const caseData = ref<Case[]>([]);
const caseColumns = computed(() => {
  const columnsToShow = ["id", "name", "description"];
  return getCaseColumns("instructor").filter(column => {
    const key =
      "id" in column
        ? column.id
        : "accessorKey" in column
        ? column.accessorKey
        : undefined;
    return key ? columnsToShow.includes(String(key)) : false;
  });
});

async function getCases(): Promise<Case[]> {
  return cases;
}

onMounted(async () => {
  studentData.value = await getStudents();
  caseData.value = await getCases();
});
</script>

<style scoped></style>
