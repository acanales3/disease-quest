<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Classroom } from "../ClassroomDatatable/columns";

const props = defineProps<{
  open: boolean;
  classroom: Classroom | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'confirm': [classroom: Classroom];
}>();

function onCancel() {
  emit('update:open', false);
}

function onConfirm() {
  if (props.classroom) {
    emit('confirm', props.classroom);
  }
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-md">
      <DialogHeader class="text-center">
        <DialogTitle class="text-red-600 text-center">Delete Classroom</DialogTitle>
        <DialogDescription class="text-left">
          Are you sure you want to delete this classroom? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div v-if="classroom" class="py-4">
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Name:</span>
            <span class="text-sm font-medium">{{ classroom.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Code:</span>
            <span class="text-sm font-medium">{{ classroom.code }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">Instructor:</span>
            <span class="text-sm font-medium">{{ classroom.instructor }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500">School:</span>
            <span class="text-sm font-medium">{{ classroom.school }}</span>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2 sm:justify-center">
        <Button variant="outline" @click="onCancel">
          Cancel
        </Button>
        <Button variant="destructive" @click="onConfirm">
          Delete Classroom
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
