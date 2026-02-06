<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Classroom } from "../ClassroomDatatable/columns";

type DeleteState =
  | { status: "idle"; message?: string }
  | { status: "loading"; message?: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const props = defineProps<{
  open: boolean;
  classroom: Classroom | null;
  state: DeleteState;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [classroom: Classroom];
  'reset': [];
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
  emit('update:open', false);
}

function onConfirm() {
  if (!props.classroom) return;
  emit('confirm', props.classroom);
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-md">
      <DialogHeader class="text-center">
        <DialogTitle class="text-red-600 text-center">Delete Classroom</DialogTitle>
        <DialogDescription class="text-left">
          Are you sure you want to delete this classroom? This action cannot be undone. All student enrollments for this classroom will also be removed.
        </DialogDescription>
      </DialogHeader>

      <div v-if="classroom" class="py-3">
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between gap-4">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm font-medium text-right">{{ classroom.name }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-sm text-gray-500">Code:</span>
            <span class="text-sm font-medium text-right">{{ classroom.code }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-sm text-gray-500">Instructor:</span>
            <span class="text-sm font-medium text-right">{{ classroom.instructor }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-sm text-gray-500">School:</span>
            <span class="text-sm font-medium text-right">{{ classroom.school }}</span>
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
          :disabled="!classroom || !canDelete || isBusy"
          @click="onConfirm"
        >
          {{ isBusy ? "Deleting..." : "Delete Classroom" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
