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
          <div class="font-semibold mt-2">Invitation Code</div>
          <div class="font-mono font-bold tracking-widest">
            {{ classroom.invitationCode || 'N/A' }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-gray-500">
      Classroom not found.
    </div>

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
      <CaseDataTable :columns="caseColumns" :data="caseData" />
    </div>

    <!-- STUDENT TABLE -->
    <div class="w-full py-2">
      <StudentDataTable :columns="studentColumns" :data="studentData" />
    </div>

    <!-- Remove Case Confirmation Dialog -->
    <Dialog v-model:open="showRemoveCaseDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="text-red-600">Remove Case from Classroom</DialogTitle>
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
  const columnsToShow = ["id", "name", "description", "actions"];
  return getCaseColumns("instructor", {
    classroomId,
    onRemoveFromClassroom: handleRemoveCaseFromClassroom,
  }).filter(column => {
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
    await $fetch(`/api/classrooms/${classroomId}/cases/${pendingRemoveCaseId.value}`, {
      method: "DELETE",
    });
    caseData.value = await getCases();
    showRemoveCaseDialog.value = false;
    pageMessage.value = { type: "success", text: "Case removed from classroom successfully." };
    setTimeout(() => { pageMessage.value = null; }, 5000);
  } catch (error: any) {
    console.error("Failed to remove case from classroom:", error);
    pageMessage.value = {
      type: "error",
      text: error?.data?.statusMessage || error?.message || "Failed to remove case from classroom.",
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
