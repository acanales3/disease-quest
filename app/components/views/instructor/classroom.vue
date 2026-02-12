<template>
  <div class="space-y-10">
    <!-- CLASSROOM DETAILS -->
    <div v-if="classroom" class="bg-white shadow rounded p-8 text-center">
      <h1 class="text-2xl font-bold mb-6 text-gray-900">
        {{ classroom.name }}
      </h1>

      <div class="grid grid-cols-2 gap-y-6 gap-x-10 max-w-4xl mx-auto text-gray-700">
        <div>
          <div class="font-semibold">Subject</div>
          <div>{{ classroom.code }}</div>
        </div>

        <div>
          <div class="font-semibold">MS Year</div>
          <div>{{ classroom.msyear ?? "N/A" }}</div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">
      Classroom not found.
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
import type { Classroom } from "~/assets/interface/Classroom";

/* students */
import type { Student } from "../../StudentDatatable/columns";
import { getColumns as getStudentColumns } from "../../StudentDatatable/columns";
import StudentDataTable from "../../StudentDatatable/data-table.vue";


const route = useRoute();
const classroomId = Number(route.params.classroomId);

const classroom = ref<Classroom | null>(null);

async function getClassroom(): Promise<void> {
  try {
    const data: any = await $fetch(`/api/classrooms/${classroomId}`);
    classroom.value = {
      id: data.id,
      name: data.name,
      code: data.subject ?? "",
      instructor: "",
      school: "",
      section: "",
      startDate: "",
      endDate: "",
      status: "active",
      msyear: data.msyear ?? null,
    };

    studentData.value = (data.students ?? []).map((s: any, idx: number) => ({
      id: idx + 1,
      name: s.name,
      email: s.email,
      school: s.school || "", 
      msyear: s.msyear,
      classroom: classroomId,
      status: s.status,
    }));
  } catch (error) {
    console.error("Failed to fetch classroom:", error);
    classroom.value = null;
  }
}

/* ===== STUDENTS ===== */
const studentData = ref<Student[]>([]);
const studentColumns = computed(() => getStudentColumns("instructor"));

onMounted(async () => {
  await getClassroom();
});
</script>

<style scoped></style>
