<template>
  <div class="space-y-4">
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
      <div class="grid grid-cols-2 sm:grid-cols-5 divide-x divide-white/10">
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
            Instructor
          </p>
          <p class="text-[15px] font-semibold text-white">
            {{ classroom.instructor || "—" }}
          </p>
          <p
            class="text-[10px] font-semibold uppercase tracking-wider text-white/40 mt-3 mb-1.5"
          >
            School
          </p>
          <p class="text-[13px] font-medium text-white/80">
            {{ classroom.school || "—" }}
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

    <!-- Cases Table -->
    <div class="w-full py-2">
      <CaseDataTable
        :columns="caseColumns"
        :data="caseData"
        :hideClassroomFilter="true"
      />
    </div>

    <!-- Student Table -->
    <div class="w-full py-2">
      <StudentDataTable
        :columns="studentColumns"
        :data="studentData"
        :hideClassroomFilter="true"
        :hideClassroomColumn="true"
      />
    </div>

    <AdminEditStudentDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      :classrooms="allClassrooms"
      @close="modalBus.closeEdit()"
      @save="saveStudentEdits"
    />

    <DeleteStudentModal
      v-model:open="isDeleteModalOpen"
      :student="studentToDelete"
      :mode="deleteMode"
      :state="deleteState"
      :available-classrooms="classroom ? [classroom] : []"
      @confirm="handleDeleteConfirm"
      @reset="resetDeleteState"
    />

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
import type { Classroom, ClassroomOptions } from "~/assets/interface/Classroom";

/* cases */
import type { Case } from "../../CaseDatatable/columns";
import { getColumns as getCaseColumns } from "@/components/CaseDatatable/columns";
import CaseDataTable from "../../CaseDatatable/data-table.vue";
import { cases } from "~/assets/interface/Case";

/* students */
import type { Student } from "../../StudentDatatable/columns";
import { getColumns as getStudentColumns } from "../../StudentDatatable/columns";
import StudentDataTable from "../../StudentDatatable/data-table.vue";

/* modal */
import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent";
import AdminEditStudentDialog from "@/components/AdminEditStudentDialog/AdminEditStudentDialog.vue";
import DeleteStudentModal from "@/components/DeleteStudentModal/DeleteStudentModal.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const isDeleteModalOpen = ref(false);
const studentToDelete = ref<Student | null>(null);
const deleteMode = ref<"delete" | "unenroll">("unenroll");
const deleteState = ref<DeleteState>({ status: "idle" });

type PageMessage = { type: "success" | "error"; text: string };
const pageMessage = ref<PageMessage | null>(null);

const route = useRoute();
const classroomId = Number(route.params.classroomId);

const classroom = ref<Classroom | undefined>(undefined);
const allClassrooms = ref<ClassroomOptions[]>([]);

async function fetchClassroom() {
  try {
    const fetched = await $fetch<Classroom[]>("/api/classrooms");
    classroom.value = fetched.find((c) => c.id === classroomId);
  } catch (error) {
    console.error("Error fetching classroom: ", error);
  }
}

async function fetchAllClassrooms() {
  try {
    const data = await $fetch<ClassroomOptions[]>("/api/classrooms");
    allClassrooms.value = data;
  } catch (error) {
    console.error("Failed to fetch classrooms: ", error);
    allClassrooms.value = [];
  }
}

/* ===== STUDENTS ===== */
const studentData = ref<Student[]>([]);
const studentColumns = computed(() =>
  getStudentColumns("admin", {
    onDelete: handleDeleteClick,
    onRemoveFromClassroom: handleRemoveFromClassroomClick,
    classrooms: classroom.value ? [classroom.value] : [],
    hideClassroomColumn: true,
  }),
);

async function getStudents(): Promise<Student[]> {
  try {
    const data = await $fetch(`/api/classrooms/${classroomId}/students`);

    return data.map((s: any) => ({
      userId: s.userId,
      id: s.id,
      name: s.name,
      nickname: s.nickname,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      school: s.school || "",
      msyear: s.msyear,
      status: s.status,
      classrooms: [
        {
          id: classroomId,
          name: classroom.value?.name || "",
        },
      ],
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
  return getCaseColumns("admin", {
    classroomId,
    onRemoveFromClassroom: handleRemoveCaseFromClassroom,
    returnTo: `/admin/classroom/${classroomId}`,
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

/* ===== SAVE ===== */
const saveStudentEdits = async (updated: Student) => {
  try {
    await $fetch(`/api/admins/users/${updated.userId}`, {
      method: "PUT",
      body: {
        first_name: updated.first_name,
        last_name: updated.last_name,
        email: updated.email,
        school: updated.school,
        status: updated.status,
      },
    });

    await $fetch(`/api/students/${updated.userId}`, {
      method: "PUT",
      body: updated,
    });

    studentData.value = studentData.value.map((s) =>
      s.userId === updated.userId ? { ...s, ...updated } : s,
    );

    modalBus.closeEdit();
  } catch (err) {
    console.error(err);
  }
};

/* ===== DELETE ===== */
function resetDeleteState() {
  deleteState.value = { status: "idle" };
}

function handleDeleteClick(s: Student) {
  deleteMode.value = "delete";
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

function handleRemoveFromClassroomClick(s: Student) {
  deleteMode.value = "unenroll";
  studentToDelete.value = s;
  isDeleteModalOpen.value = true;
}

async function handleDeleteConfirm(
  s: Student,
  selectedClassroomIds?: number[],
) {
  deleteState.value = { status: "loading" };

  try {
    if (!s.userId) throw new Error("Missing student userId");

    if (deleteMode.value === "delete") {
      await $fetch(`/api/students/${s.userId}`, {
        method: "DELETE",
      });

      studentData.value = studentData.value.filter(
        (st) => st.userId !== s.userId,
      );
    } else {
      await $fetch(`/api/students/${s.userId}`, {
        method: "DELETE",
        query: { classroomIds: classroomId.toString() },
      });

      studentData.value = studentData.value.filter(
        (st) => st.userId !== s.userId,
      );
    }

    deleteState.value = {
      status: "success",
      message:
        deleteMode.value === "delete"
          ? "Student deleted successfully."
          : "Student removed from classroom.",
    };

    isDeleteModalOpen.value = false;
    studentToDelete.value = null;
  } catch (err: any) {
    deleteState.value = {
      status: "error",
      message: err?.message || "Delete failed.",
    };
  }
}

onMounted(async () => {
  await fetchClassroom();
  await fetchAllClassrooms();
  studentData.value = await getStudents();
  caseData.value = await getCases();
});
</script>
