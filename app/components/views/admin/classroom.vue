<template>
  <div class="space-y-4">
    <!-- CLASSROOM DETAILS -->
    <div v-if="classroom" class="bg-white shadow rounded p-8 text-center">
      <h1 class="text-2xl font-bold mb-6 text-gray-900">
        {{ classroom.name }}
      </h1>

      <div class="grid grid-cols-4 gap-y-6 gap-x-10 max-w-6xl mx-auto text-gray-700">
        <div>
          <div class="font-semibold">Code</div>
          <div>{{ classroom.code }}</div>
          <div class="font-semibold mt-2">Section</div>
          <div>{{ classroom.section }}</div>
        </div>

        <div>
          <div class="font-semibold">Instructor</div>
          <div>{{ classroom.instructor }}</div>
          <div class="font-semibold mt-2">School</div>
          <div>{{ classroom.school }}</div>
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

    <!-- Cases Table -->
    <div class="w-full py-2">
      <CaseDataTable :columns="caseColumns" :data="caseData" />
    </div>

    <!-- Student Table -->
    <div class="w-full py-2">
      <StudentDataTable :columns="studentColumns" :data="studentData" />
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
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

/* classroom */
import { classrooms, type Classroom } from "~/assets/interface/Classroom";

/* cases */
import type { Case } from "../../CaseDatatable/columns";
import { getColumns as getCaseColumns } from "@/components/CaseDatatable/columns";
import CaseDataTable from "../../CaseDatatable/data-table.vue";
import { cases } from "~/assets/interface/Case";

/* students */
import type { Student } from "../../StudentDatatable/columns";
import { getColumns as getStudentColumns } from "../../StudentDatatable/columns";
import StudentDataTable from "../../StudentDatatable/data-table.vue";
import { student } from "~/assets/interface/Student";

/* modal */
import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent";
import AdminEditStudentDialog from "@/components/AdminEditStudentDialog/AdminEditStudentDialog.vue";

const route = useRoute();
const classroomId = Number(route.params.classroomId);

const classroom: Classroom | undefined = classrooms.find(
  c => c.id === classroomId
);

/* ===== STUDENTS ===== */
const studentData = ref<Student[]>([]);
const studentColumns = computed(() => getStudentColumns("admin"));

async function getStudents(): Promise<Student[]> {
  try {
    const data = await $fetch(`/api/classrooms/${classroomId}/students`);
    return data.map((s: any) => ({
      id: s.id as unknown as number, // Cast to number to satisfy interface, though it's a UUID string
      name: s.name,
      email: s.email,
      school: classroom?.school || "", 
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
  const columnsToShow = ["id", "name", "description", "actions"];
  return getCaseColumns("admin").filter(column => {
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

/* ===== SAVE ===== */
const saveStudentEdits = async (updated: Student) => {
  studentData.value = studentData.value.map(s =>
    s.id === updated.id ? { ...updated } : s
  );
  modalBus.closeEdit();
};

onMounted(async () => {
  studentData.value = await getStudents();
  caseData.value = await getCases();
});
</script>
