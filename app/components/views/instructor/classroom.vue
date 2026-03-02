<template>
  <div class="space-y-10">
    <!-- INVITE CODE BANNER (shown after classroom creation) -->
    <div
      v-if="inviteCode"
      class="rounded-md border border-green-200 bg-green-50 px-6 py-4 text-center"
    >
      <p class="text-green-800 font-semibold text-lg mb-1">
        Classroom created successfully!
      </p>
      <p class="text-green-700 text-sm">
        Share this invite code with your students:
      </p>
      <p class="mt-2 text-2xl font-mono font-bold tracking-widest text-green-900">
        {{ inviteCode }}
      </p>
    </div>

    <!-- CLASSROOM DETAILS -->
    <div v-if="classroom" class="rounded-2xl overflow-hidden shadow-lg" style="background: linear-gradient(135deg, #3b1566 0%, #5a2590 50%, #3f1d72 100%);">
      <!-- Top bar: label + status badge -->
      <div class="flex items-center justify-between px-8 pt-6 pb-0">
        <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">Manage Classroom</p>
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold text-white"
          :style="classroom.status === 'active'
            ? 'background: linear-gradient(135deg, #166534, #15803d, #16a34a)'
            : 'background: linear-gradient(135deg, #7f1d1d, #b91c1c, #dc2626)'"
        >
          {{ classroom.status }}
        </span>
      </div>

      <!-- Classroom name -->
      <div class="px-8 pt-2 pb-6 border-b border-white/10">
        <h1 class="text-[26px] font-semibold text-white tracking-tight leading-snug">{{ classroom.name }}</h1>
      </div>

      <!-- Meta row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
        <div class="px-7 py-5">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Code</p>
          <p class="text-[15px] font-semibold text-white tabular-nums">{{ classroom.code || '—' }}</p>
        </div>
        <div class="px-7 py-5">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Section</p>
          <p class="text-[15px] font-semibold text-white">{{ classroom.section || '—' }}</p>
        </div>
        <div class="px-7 py-5">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Start Date</p>
          <p class="text-[15px] font-semibold text-white tabular-nums">{{ classroom.startDate || '—' }}</p>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mt-3 mb-1.5">End Date</p>
          <p class="text-[13px] font-medium text-white/80 tabular-nums">{{ classroom.endDate || '—' }}</p>
        </div>
        <div class="px-7 py-5">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Invitation Code</p>
          <p class="text-[15px] font-mono font-bold tracking-[0.2em] text-white">{{ classroom.invitationCode || 'N/A' }}</p>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">
      Classroom not found.
    </div>

    <!-- CASES TABLE -->
    <div class="w-full py-2">
      <CaseDataTable :columns="caseColumns" :data="caseData" :hideClassroomFilter="true" />
    </div>

    <!-- STUDENT TABLE -->
    <div class="w-full py-2">
      <StudentDataTable :columns="studentColumns" :data="studentData" :hideClassroomFilter="true" />
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

// Invite code passed via query param after classroom creation
const inviteCode = computed(() => route.query.inviteCode as string | undefined);

const classroom = ref<Classroom | undefined>(undefined);

async function fetchClassroom() {
  try {
    const allClassrooms = await $fetch<Classroom[]>('/api/classrooms');
    classroom.value = allClassrooms.find(c => c.id === classroomId);
  } catch {
    // Fallback to local data
    classroom.value = classrooms.find(c => c.id === classroomId);
  }
}

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
  try {
    return await $fetch<Case[]>(`/api/classrooms/${classroomId}/cases`)
  } catch (error) {
    console.error("Failed to fetch cases:", caseData);
    return [];
  }
}

onMounted(async () => {
  await fetchClassroom();
  studentData.value = await getStudents();
  caseData.value = await getCases();
});
</script>

<style scoped></style>
