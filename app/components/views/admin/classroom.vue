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

const route = useRoute();
const classroomId = Number(route.params.classroomId);

const classroom = ref<Classroom | undefined>(undefined);
const allClassrooms = ref<ClassroomOptions[]>([]);

async function fetchClassroom() {
  try {
    const fetched = await $fetch<Classroom[]>('/api/classrooms');
    classroom.value = fetched.find(c => c.id === classroomId);
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
  })
);

async function getStudents(): Promise<Student[]> {
  try {
    const data = await $fetch(`/api/classrooms/${classroomId}/students`);

    return data.map((s: any) => ({
      userId: s.userId, // MUST match student view
      id: s.id,         // optional if your table needs it
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
  try {
    return await $fetch<Case[]>(`/api/classrooms/${classroomId}/cases`)
  } catch (error) {
    console.error("Failed to fetch cases:", caseData);
    return [];
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
      s.userId === updated.userId ? { ...s, ...updated } : s
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
  selectedClassroomIds?: number[]
) {
  deleteState.value = { status: "loading" };

  try {
    if (!s.userId) throw new Error("Missing student userId");

    if (deleteMode.value === "delete") {
      await $fetch(`/api/students/${s.userId}`, {
        method: "DELETE",
      });

      studentData.value = studentData.value.filter(
        st => st.userId !== s.userId
      );
    } else {
      await $fetch(`/api/students/${s.userId}`, {
        method: "DELETE",
        query: { classroomIds: classroomId.toString() },
      });

      studentData.value = studentData.value.filter(
        st => st.userId !== s.userId
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
