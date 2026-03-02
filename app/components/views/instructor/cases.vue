<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Content</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight">Cases</h1>
          <p class="text-gray-500 text-[15px] mt-2">
            Review your assigned case library and distribute cases to classrooms.
          </p>
          <div class="mt-3 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 bg-gray-700 text-white text-xs font-medium px-3 py-1 rounded-full">
              <Icon name="lucide:book-open" size="11" />
              {{ casesData.length }} cases
            </span>
          </div>
        </div>
        <div class="shrink-0">
          <AssignCaseDialog :cases="casesData" :classrooms="classroomsData" />
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
      Loading cases...
    </div>

    <div v-else-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
      {{ errorMessage }}
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

    <!-- Cases Table -->
    <div class="w-full py-2">
      <DataTable
        :columns="visibleColumns"
        :data="casesData"
        :classrooms="classroomsData"
        @refresh="refreshCases()"
      />
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
import { computed, ref, watchEffect } from "vue";
import { getColumns } from "../../CaseDatatable/columns";
import DataTable from "../../CaseDatatable/data-table.vue";
import AssignCaseDialog from "~/components/AssignCaseDialog/AssignCaseDialog.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const casesData = ref<Case[]>([]);
const classroomsData = ref<Classroom[]>([]);

const {
  data: casesApi,
  pending: casesPending,
  error: casesError,
  refresh: refreshCases,
} = await useFetch<Case[]>(
  "/api/cases/available",
  {
    default: () => [],
  },
);

const {
  data: classroomsApi,
  pending: classroomsPending,
  error: classroomsError,
} = await useFetch<Classroom[]>("/api/classrooms", {
  default: () => [],
});

watchEffect(() => {
  casesData.value = casesApi.value ?? [];
  classroomsData.value = classroomsApi.value ?? [];
});

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "classrooms", "status", "actions"];
  return getColumns("instructor", {
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
