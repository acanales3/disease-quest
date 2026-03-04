<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Content</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Cases</h1>
          <p class="text-gray-500 text-[15px] mt-2">Create, edit, play, and assign cases to classrooms.</p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="si:book-line" size="15" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ data.length }} cases</span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <CreateCaseDialog />
          <AssignCaseDialog :cases="data" :classrooms="classroomsData" />
        </div>
      </div>
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

    <div class="w-full py-2">
      <!-- Cases Table -->
      <DataTable :columns="visibleColumns" :data="data" @refresh="refreshCases()" />
    </div>

    <!-- Remove from Classroom(s) Modal -->
    <Dialog v-model:open="showRemoveDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle class="text-red-600">Remove Case from Classroom</DialogTitle>
          <DialogDescription>
            Select which classroom(s) to remove
            <span class="font-semibold">{{ pendingCase?.name }}</span> from.
          </DialogDescription>
        </DialogHeader>

        <div v-if="pendingCase" class="py-3 space-y-2 max-h-60 overflow-y-auto">
          <label
            v-for="cr in pendingCase.classrooms"
            :key="cr.id"
            class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="cr.id"
              v-model="selectedClassroomIds"
              class="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span class="text-sm text-gray-700">{{ cr.name }}</span>
          </label>
        </div>

        <DialogFooter class="gap-2 sm:justify-end">
          <Button variant="outline" @click="showRemoveDialog = false">
            Cancel
          </Button>
          <Button
            class="bg-red-600 text-white hover:bg-red-700"
            :disabled="selectedClassroomIds.length === 0 || isRemoving"
            @click="confirmRemoveFromClassrooms"
          >
            {{ isRemoving ? "Removing..." : "Remove Selected" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { Case } from "../../CaseDatatable/columns";
import type { Classroom } from "~/assets/interface/Classroom";
import { computed, watchEffect, ref } from "vue";
import { getColumns } from "@/components/CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import CreateCaseDialog from "../../../components/CreateCaseDialog/CreateCaseDialog.vue";
import TotalCount from "../../../components/ui/TotalCount.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";
import { Icon } from "#components";

const {
  data: apiData,
  pending: casesPending,
  error: casesError,
  refresh: refreshCases,
} = await useFetch<Case[]>("/api/cases/available", { default: () => [] });

const {
  data: classroomsApi,
  pending: classroomsPending,
  error: classroomsError,
} = await useFetch<Classroom[]>("/api/classrooms", { default: () => [] });

const data = ref<Case[]>([]);
const classroomsData = ref<Classroom[]>([]);

watchEffect(() => {
  data.value = apiData.value ?? [];
  classroomsData.value = classroomsApi.value ?? [];
});

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "classrooms", "status", "actions"];
  return getColumns("admin", {
    onRemoveFromClassrooms: openRemoveDialog,
    onRefresh: () => refreshCases(),
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

const isLoading = computed(() => casesPending.value || classroomsPending.value);

const errorMessage = computed(() => {
  const e: any = casesError.value || classroomsError.value;
  if (!e) return "";
  if (e.statusCode === 401) return "You are not logged in.";
  if (e.statusCode === 403) return "You do not have permission to view cases.";
  if (e.statusCode === 400) return e.statusMessage || "Bad request.";
  return e.statusMessage || e.message || "Unknown error.";
});


type PageMessage = { type: "success" | "error"; text: string };
const pageMessage = ref<PageMessage | null>(null);

/* ---------- REMOVE FROM CLASSROOM(S) ---------- */
const showRemoveDialog = ref(false);
const pendingCase = ref<Case | null>(null);
const selectedClassroomIds = ref<number[]>([]);
const isRemoving = ref(false);

function openRemoveDialog(caseData: Case) {
  pendingCase.value = caseData;
  selectedClassroomIds.value = [];
  showRemoveDialog.value = true;
}

async function confirmRemoveFromClassrooms() {
  if (!pendingCase.value || selectedClassroomIds.value.length === 0) return;
  isRemoving.value = true;
  pageMessage.value = null;
  const count = selectedClassroomIds.value.length;
  try {
    await Promise.all(
      selectedClassroomIds.value.map((classroomId) =>
        $fetch(`/api/classrooms/${classroomId}/cases/${pendingCase.value!.id}`, {
          method: "DELETE",
        })
      )
    );
    showRemoveDialog.value = false;
    await refreshCases();
    pageMessage.value = {
      type: "success",
      text: `Case removed from ${count} classroom${count > 1 ? "s" : ""} successfully.`,
    };
    setTimeout(() => { pageMessage.value = null; }, 5000);
  } catch (error: any) {
    console.error("Failed to remove case from classrooms:", error);
    pageMessage.value = {
      type: "error",
      text: error?.data?.statusMessage || error?.message || "Failed to remove case from classroom(s).",
    };
  } finally {
    isRemoving.value = false;
    pendingCase.value = null;
    selectedClassroomIds.value = [];
  }
}
</script>
