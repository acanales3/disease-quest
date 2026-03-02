<template>
  <div class="flex flex-col w-full">
    <!-- Num Cases & Create Case Button -->
    <div class="flex justify-center gap-4">
      <TotalCount
        :count="data.length"
        label="Total Cases"
        icon="si:book-line"
      />
      <CreateCaseDialog />
    </div>

    <div class="w-full py-2">
      <!-- Cases Table -->
      <DataTable :columns="visibleColumns" :data="data" @refresh="refresh()" />
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

const {
  data: apiData,
  pending,
  error,
  refresh,
} = await useFetch<Case[]>("/api/cases/available", { default: () => [] });

const data = ref<Case[]>([]);
watchEffect(() => {
  data.value = apiData.value ?? [];
});

const visibleColumns = computed(() => {
  const columnsToShow = ["id", "name", "description", "classrooms", "status", "actions"];
  return getColumns("admin", {
    onRemoveFromClassrooms: openRemoveDialog,
    onRefresh: () => refresh(),
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

const errorMessage = computed(() => {
  const e: any = error.value;
  if (!e) return "";
  if (e.statusCode === 401) return "You are not logged in.";
  if (e.statusCode === 403) return "You do not have permission to view cases.";
  if (e.statusCode === 400) return e.statusMessage || "Bad request.";
  return e.statusMessage || e.message || "Unknown error.";
});


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
  try {
    await Promise.all(
      selectedClassroomIds.value.map((classroomId) =>
        $fetch(`/api/classrooms/${classroomId}/cases/${pendingCase.value!.id}`, {
          method: "DELETE",
        })
      )
    );
    showRemoveDialog.value = false;
    await refresh();
  } catch (error) {
    console.error("Failed to remove case from classrooms:", error);
  } finally {
    isRemoving.value = false;
    pendingCase.value = null;
    selectedClassroomIds.value = [];
  }
}
</script>
