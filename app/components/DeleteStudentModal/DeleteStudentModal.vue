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

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const props = defineProps<{
  open: boolean;
  student: Student | null;
  state: DeleteState;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [student: Student];
  reset: [];
}>();

const confirmation = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      confirmation.value = "";
      emit("reset");
    }
  }
);

const canDelete = computed(() => confirmation.value.trim().toUpperCase() === "DELETE");
const isBusy = computed(() => props.state.status === "loading");

function onCancel() {
  emit("update:open", false);
}

function onConfirm() {
  if (!props.student) return;
  emit("confirm", props.student);
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-lg">
      <DialogHeader class="text-center">
        <DialogTitle class="text-red-600 text-center">Delete Student</DialogTitle>
        <DialogDescription class="text-left">
          This will permanently delete the student and their associated data. This action cannot be undone.
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

        <div class="mt-4 space-y-2">
          <p class="text-sm text-gray-600">
            Type <span class="font-semibold">DELETE</span> to confirm.
          </p>
          <Input
            v-model="confirmation"
            :disabled="isBusy"
            placeholder="Type DELETE to confirm"
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
          :disabled="!student || !canDelete || isBusy"
          @click="onConfirm"
        >
          {{ isBusy ? "Deleting..." : "Delete Student" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

