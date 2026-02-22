<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Instructor } from "@/components/InstructorDatatable/columns";

const props = defineProps<{
  open: boolean;
  instructor: Instructor | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "confirm": [instructor: Instructor];
}>();

const typed = ref("");

const isMatch = computed(() => typed.value.trim().toUpperCase() === "DELETE");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) typed.value = ""; // reset every time dialog opens
  }
);

function onCancel() {
  emit("update:open", false);
}

function onConfirm() {
  if (!isMatch.value) return;
  if (props.instructor) emit("confirm", props.instructor);
  emit("update:open", false);
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-md">
      <DialogHeader class="text-center">
        <DialogTitle class="text-red-600 text-center">
          Delete Instructor
        </DialogTitle>
        <DialogDescription class="text-left space-y-2">
          <div>
            This will permanently delete the instructor and cannot be undone.
          </div>
          <div>
            Deleting will remove all associated classrooms and unenroll linked
            students.
          </div>
          <div class="font-medium text-red-700">
            To confirm, type <span class="font-bold">DELETE</span> below.
          </div>
        </DialogDescription>
      </DialogHeader>

      <div v-if="instructor" class="py-4 space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm font-medium">{{ instructor.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Email:</span>
            <span class="text-sm font-medium">{{ instructor.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">School:</span>
            <span class="text-sm font-medium">{{ instructor.school }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Status:</span>
            <span class="text-sm font-medium">{{ instructor.status }}</span>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-gray-600">
            Type <span class="font-semibold">DELETE</span> to confirm
          </label>
          <Input v-model="typed" placeholder="DELETE" />
          <p v-if="typed && !isMatch" class="text-xs text-red-600">
            Confirmation text does not match.
          </p>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:justify-center">
        <Button variant="outline" @click="onCancel">
          Cancel
        </Button>
        <Button
          variant="destructive"
          :disabled="!isMatch"
          @click="onConfirm"
        >
          Delete Instructor
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
