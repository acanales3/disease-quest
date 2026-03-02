<template>
  <div class="flex flex-col w-full">
    <!-- Num Cases + Create + Assign Buttons -->
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Cases"
        icon="si:book-line"
      />

      <!-- Create Case -->
      <CreateCaseDialog :on-case-created="refreshCases" />

      <!-- Assign Case -->
      <AssignCaseDialog
        :cases="data"
        :classrooms="classroomsData"
      />
    </div>

    <div class="w-full py-2">
      <!-- Cases Table -->
      <DataTable :columns="visibleColumns" :data="data" :classrooms="classroomsData" />
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

    <EditCaseDialog
      :show="isEditModalOpen"
      :data="caseToEdit"
      @close="handleEditClose"
      @save="saveCaseEdits"
    />

    <DeleteCaseModal
      v-model:open="isDeleteModalOpen"
      :case-data="caseToDelete"
      :state="deleteState"
      @confirm="handleDeleteConfirm"
      @reset="resetDeleteState"
    />
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import type { Classroom } from "~/assets/interface/Classroom";
import { computed, watchEffect, ref } from "vue";
import { getColumns } from "@/components/CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import CreateCaseDialog from "../../../components/CreateCaseDialog/CreateCaseDialog.vue";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";
import TotalCount from "../../../components/ui/TotalCount.vue";
import EditCaseDialog from "@/components/EditCaseDialog/EditCaseDialog.vue";
import DeleteCaseModal from "@/components/DeleteCaseModal/DeleteCaseModal.vue";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "classrooms", "actions"];
  return getColumns("admin", {
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
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

/* ---------- FETCHES ---------- */
const { data: apiData, pending, error, refresh } = await useFetch<Case[]>(
  "/api/cases/available",
  { default: () => [] }
);

const { data: classroomsApi } = await useFetch<Classroom[]>("/api/classrooms", {
  default: () => [],
});

const data = ref<Case[]>([]);
const classroomsData = ref<Classroom[]>([]);
const pageMessage = ref<{ type: "success" | "error"; text: string } | null>(null);
const isEditModalOpen = ref(false);
const caseToEdit = ref<Case | null>(null);
const isDeleteModalOpen = ref(false);
const caseToDelete = ref<Case | null>(null);
const deleteState = ref<DeleteState>({ status: "idle" });

watchEffect(() => {
  data.value = apiData.value ?? [];
  classroomsData.value = classroomsApi.value ?? [];
});

function handleEditClick(caseData: Case) {
  pageMessage.value = null;
  caseToEdit.value = caseData;
  isEditModalOpen.value = true;
}

function handleEditClose() {
  isEditModalOpen.value = false;
  caseToEdit.value = null;
}

async function refreshCases() {
  await refresh();
}

async function saveCaseEdits(updatedCase: Case) {
  pageMessage.value = null;
  try {
    const response = await $fetch<{
      success: boolean;
      case: { id: number; name: string; description: string };
      message: string;
    }>(`/api/cases/${updatedCase.id}`, {
      method: "PATCH",
      body: {
        name: updatedCase.name,
        description: updatedCase.description,
      },
    });

    // Keep the table order stable: patch the row in place rather than re-fetching.
    data.value = data.value.map((c) =>
      c.id === updatedCase.id
        ? { ...c, name: response.case.name, description: response.case.description }
        : c,
    );
    pageMessage.value = {
      type: "success",
      text: `Case "${updatedCase.name}" has been updated.`,
    };
    handleEditClose();
  } catch (err: any) {
    const msg =
      err?.data?.message || err?.statusMessage || "Failed to update case.";
    pageMessage.value = { type: "error", text: msg };
  }
}

function resetDeleteState() {
  deleteState.value = { status: "idle" };
}

function handleDeleteClick(caseData: Case) {
  pageMessage.value = null;
  caseToDelete.value = caseData;
  isDeleteModalOpen.value = true;
}

async function handleDeleteConfirm(caseData: Case) {
  deleteState.value = { status: "loading" };
  pageMessage.value = null;

  try {
    await $fetch(`/api/cases/${caseData.id}`, { method: "DELETE" });

    deleteState.value = {
      status: "success",
      message: "Case deleted successfully.",
    };
    await refreshCases();
    pageMessage.value = {
      type: "success",
      text: `Case "${caseData.name}" has been deleted.`,
    };
    isDeleteModalOpen.value = false;
    caseToDelete.value = null;
  } catch (err: any) {
    const msg =
      err?.data?.message || err?.statusMessage || "Failed to delete case.";
    deleteState.value = { status: "error", message: msg };
    pageMessage.value = { type: "error", text: msg };
  }
}

const errorMessage = computed(() => {
  const e: any = error.value;
  if (!e) return "";
  if (e.statusCode === 401) return "You are not logged in.";
  if (e.statusCode === 403) return "You do not have permission to view cases.";
  if (e.statusCode === 400) return e.statusMessage || "Bad request.";
  return e.statusMessage || e.message || "Unknown error.";
});
</script>
