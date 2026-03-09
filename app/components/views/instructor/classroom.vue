<template>
  <div class="space-y-10">
    <div>
      <BackwardButton route="/instructor/classrooms" />
    </div>

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
      <p
        class="mt-2 text-2xl font-mono font-bold tracking-widest text-green-900"
      >
        {{ inviteCode }}
      </p>
    </div>

    <!-- CLASSROOM DETAILS -->
    <div
      v-if="classroom"
      class="rounded-2xl overflow-hidden shadow-lg"
      style="
        background: linear-gradient(
          135deg,
          #3b1566 0%,
          #5a2590 50%,
          #3f1d72 100%
        );
      "
    >
      <!-- Top bar: label + status badge -->
      <div class="flex items-center justify-between px-8 pt-6 pb-0">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40"
        >
          Manage Classroom
        </p>
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold text-white"
          :style="
            classroom.status === 'active'
              ? 'background: linear-gradient(135deg, #166534, #15803d, #16a34a)'
              : 'background: linear-gradient(135deg, #7f1d1d, #b91c1c, #dc2626)'
          "
        >
          {{ classroom.status }}
        </span>
      </div>

      <!-- Classroom name -->
      <div class="px-8 pt-2 pb-6 border-b border-white/10">
        <h1
          class="text-[26px] font-semibold text-white tracking-tight leading-snug"
        >
          {{ classroom.name }}
        </h1>
      </div>

      <!-- Meta row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
        <div class="px-7 py-5">
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5"
          >
            Code
          </p>
          <p class="text-[15px] font-semibold text-white tabular-nums">
            {{ classroom.code || "—" }}
          </p>
        </div>
        <div class="px-7 py-5">
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5"
          >
            Section
          </p>
          <p class="text-[15px] font-semibold text-white">
            {{ classroom.section || "—" }}
          </p>
        </div>
        <div class="px-7 py-5">
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5"
          >
            Start Date
          </p>
          <p class="text-[15px] font-semibold text-white tabular-nums">
            {{ classroom.startDate || "—" }}
          </p>
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mt-3 mb-1.5"
          >
            End Date
          </p>
          <p class="text-[13px] font-medium text-white/80 tabular-nums">
            {{ classroom.endDate || "—" }}
          </p>
        </div>
        <div class="px-7 py-5">
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5"
          >
            Invitation Code
          </p>
          <p
            class="text-[15px] font-mono font-bold tracking-[0.2em] text-white"
          >
            {{ classroom.invitationCode || "N/A" }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">Classroom not found.</div>

    <div v-if="pageMessage" class="w-full py-2">
      <div
        class="rounded-md border px-4 py-3 text-sm"
        :class="
          pageMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        {{ pageMessage.text }}
      </div>
    </div>

    <!-- CASES TABLE -->
    <div class="w-full py-2">
      <CaseDataTable
        :columns="caseColumns"
        :data="caseData"
        :hideClassroomFilter="true"
        title="Assigned Cases"
      />
    </div>

    <!-- STUDENT TABLE -->
    <div class="w-full py-2">
      <StudentDataTable
        :columns="studentColumns"
        :data="studentData"
        :hideClassroomFilter="true"
        :hideClassroomColumn="true"
        title="Classroom Roster"
      />
    </div>

    <!-- Remove Case Confirmation Dialog -->
    <Dialog v-model:open="showRemoveCaseDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="text-red-600"
            >Remove Case from Classroom</DialogTitle
          >
          <DialogDescription>
            Are you sure you want to remove this case from the classroom?
            Students will no longer be able to access it from this classroom.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="gap-2 sm:justify-end">
          <Button variant="outline" @click="showRemoveCaseDialog = false">
            Cancel
          </Button>
          <Button
            class="bg-red-600 text-white hover:bg-red-700"
            :disabled="isRemovingCase"
            @click="confirmRemoveCase"
          >
            {{ isRemovingCase ? "Removing..." : "Remove" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
import BackwardButton from "@/components/BackwardButton/BackwardButton.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const route = useRoute();
const classroomId = Number(route.params.classroomId);

const inviteCode = computed(() => route.query.inviteCode as string | undefined);

const classroom = ref<Classroom | undefined>(undefined);

async function fetchClassroom() {
  try {
    const allClassrooms = await $fetch<Classroom[]>("/api/classrooms");
    classroom.value = allClassrooms.find((c) => c.id === classroomId);
  } catch {
    classroom.value = classrooms.find((c) => c.id === classroomId);
  }
}

/* ===== STUDENTS ===== */
const studentData = ref<Student[]>([]);
const studentColumns = computed(() =>
  getStudentColumns("instructor", {
    hideClassroomColumn: true,
  }),
);

async function getStudents(): Promise<Student[]> {
  try {
    const data = await $fetch(`/api/classrooms/${classroomId}/students`);
    return data.map((s: any) => ({
      id: s.id as unknown as number,
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
  const columnsToShow = ["id", "name", "description", "actions"];
  return getCaseColumns("instructor", {
    classroomId,
    onRemoveFromClassroom: handleRemoveCaseFromClassroom,
    returnTo: `/instructor/classroom/${classroomId}`,
  }).filter((column) => {
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
    return await $fetch<Case[]>(`/api/classrooms/${classroomId}/cases`);
  } catch (error) {
    console.error("Failed to fetch cases:", caseData);
    return [];
  }
}

type PageMessage = { type: "success" | "error"; text: string };
const pageMessage = ref<PageMessage | null>(null);

const showRemoveCaseDialog = ref(false);
const pendingRemoveCaseId = ref<number | null>(null);
const isRemovingCase = ref(false);

function handleRemoveCaseFromClassroom(caseId: number) {
  pendingRemoveCaseId.value = caseId;
  showRemoveCaseDialog.value = true;
}

async function confirmRemoveCase() {
  if (!pendingRemoveCaseId.value) return;
  isRemovingCase.value = true;
  pageMessage.value = null;
  try {
    await $fetch(
      `/api/classrooms/${classroomId}/cases/${pendingRemoveCaseId.value}`,
      {
        method: "DELETE",
      },
    );
    caseData.value = await getCases();
    showRemoveCaseDialog.value = false;
    pageMessage.value = {
      type: "success",
      text: "Case removed from classroom successfully.",
    };
    setTimeout(() => {
      pageMessage.value = null;
    }, 5000);
  } catch (error: any) {
    console.error("Failed to remove case from classroom:", error);
    pageMessage.value = {
      type: "error",
      text:
        error?.data?.statusMessage ||
        error?.message ||
        "Failed to remove case from classroom.",
    };
  } finally {
    isRemovingCase.value = false;
    pendingRemoveCaseId.value = null;
  }
}

onMounted(async () => {
  await fetchClassroom();
  studentData.value = await getStudents();
  caseData.value = await getCases();
});
</script>

<style scoped></style>
