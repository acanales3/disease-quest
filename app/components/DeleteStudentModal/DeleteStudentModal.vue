<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Student } from "@/components/StudentDatatable/columns";
import type { Classroom } from "@/components/ClassroomDatatable/columns";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const props = defineProps<{
  open: boolean;
  student: Student | null;
  mode: "delete" | "unenroll";
  state: DeleteState;
  availableClassrooms?: Classroom[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [student: Student, selectedClassroomIds?: number[]];
  reset: [];
}>();

const confirmation = ref("");
const selectedClassroomIds = ref<number[]>([]);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      confirmation.value = "";
      selectedClassroomIds.value = [];
      emit("reset");
    }
  }
);

const enrolledClassrooms = computed(() => {
  if (props.mode !== "unenroll" || !props.student?.classrooms || !props.availableClassrooms) {
    return [];
  }
  const enrolledIds = new Set(props.student.classrooms);
  return props.availableClassrooms.filter((c) => enrolledIds.has(c.id));
});

function toggleClassroom(classroomId: number) {
  const idx = selectedClassroomIds.value.indexOf(classroomId);
  if (idx === -1) {
    selectedClassroomIds.value.push(classroomId);
  } else {
    selectedClassroomIds.value.splice(idx, 1);
  }
}

function isClassroomSelected(classroomId: number): boolean {
  return selectedClassroomIds.value.includes(classroomId);
}

const requiredToken = computed(() => (props.mode === "unenroll" ? "REMOVE" : "DELETE"));
const canConfirm = computed(() => {
  const tokenMatch = confirmation.value.trim().toUpperCase() === requiredToken.value;
  if (props.mode === "unenroll") {
    return tokenMatch && selectedClassroomIds.value.length > 0;
  }
  return tokenMatch;
});
const isBusy = computed(() => props.state.status === "loading");
const modalTitle = computed(() =>
  props.mode === "unenroll" ? "Remove Student from Classroom" : "Delete Student"
);
const modalDescription = computed(() =>
  props.mode === "unenroll"
    ? "Select the classroom(s) to remove the student from. Their account and profile will be kept."
    : "This will permanently delete the student account and related student data. This action cannot be undone."
);
const confirmActionLabel = computed(() =>
  props.mode === "unenroll" ? "Remove Student" : "Delete Student"
);
const loadingLabel = computed(() => (props.mode === "unenroll" ? "Removing..." : "Deleting..."));

function onCancel() {
  emit("update:open", false);
}

function onConfirm() {
  if (!props.student) return;
  if (props.mode === "unenroll") {
    emit("confirm", props.student, [...selectedClassroomIds.value]);
  } else {
    emit("confirm", props.student);
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-lg">
      <DialogHeader class="text-center">
        <DialogTitle class="text-red-600 text-center">{{ modalTitle }}</DialogTitle>
        <DialogDescription class="text-left">
          {{ modalDescription }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="student" class="py-3">
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between gap-4">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm font-medium text-right">{{ student.name }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-sm text-gray-500">Email:</span>
            <span class="text-sm font-medium text-right">{{ student.email }}</span>
          </div>
        </div>

        <!-- Classroom selection for unenroll mode -->
        <div v-if="mode === 'unenroll' && enrolledClassrooms.length > 0" class="mt-4 space-y-2">
          <p class="text-sm font-medium text-gray-700">
            Select classroom(s) to remove from:
          </p>
          <div class="max-h-40 overflow-y-auto border rounded-md bg-gray-50">
            <label
              v-for="classroom in enrolledClassrooms"
              :key="classroom.id"
              class="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
              :class="{ 'bg-red-50 hover:bg-red-100': isClassroomSelected(classroom.id) }"
            >
              <input
                type="checkbox"
                :checked="isClassroomSelected(classroom.id)"
                :disabled="isBusy"
                class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                @change="toggleClassroom(classroom.id)"
              />
              <div class="flex flex-col">
                <span class="text-sm font-medium text-gray-800">{{ classroom.name }}</span>
                <span class="text-xs text-gray-500">{{ classroom.code }} &middot; {{ classroom.section }}</span>
              </div>
            </label>
          </div>
          <p v-if="selectedClassroomIds.length === 0" class="text-xs text-amber-600">
            Please select at least one classroom.
          </p>
          <p v-else class="text-xs text-gray-500">
            {{ selectedClassroomIds.length }} classroom{{ selectedClassroomIds.length > 1 ? 's' : '' }} selected
          </p>
        </div>

        <div v-if="mode === 'unenroll' && enrolledClassrooms.length === 0" class="mt-4">
          <p class="text-sm text-amber-600">
            This student is not enrolled in any classrooms{{ availableClassrooms && availableClassrooms.length > 0 ? ' you have access to' : '' }}.
          </p>
        </div>

        <div class="mt-4 space-y-2">
          <p class="text-sm text-gray-600">
            Type <span class="font-semibold">{{ requiredToken }}</span> to confirm.
          </p>
          <Input
            v-model="confirmation"
            :disabled="isBusy"
            :placeholder="`Type ${requiredToken} to confirm`"
            class="bg-gray-100"
          />
        </div>

        <div v-if="state.status === 'error'" class="mt-3 text-sm text-red-600">
          {{ state.message }}
        </div>
        <div v-else-if="state.status === 'success'" class="mt-3 text-sm text-green-700">
          {{ state.message }}
        </div>
      </div>

      <DialogFooter class="gap-2 sm:justify-center">
        <Button variant="outline" :disabled="isBusy" @click="onCancel">
          Cancel
        </Button>
        <Button
          class="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          :disabled="!student || !canConfirm || isBusy"
          @click="onConfirm"
        >
          {{ isBusy ? loadingLabel : confirmActionLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

