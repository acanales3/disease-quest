<script setup lang="ts">
import { MoreHorizontal } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Student } from "./columns";
import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent"

interface Props {
  student: Student;
  role: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [student: Student];
  removeFromClassroom: [student: Student];
}>();

function onEdit() {
  modalBus.openEdit(props.student);
}

function onDelete() {
  emit('delete', props.student);
}

function onRemoveFromClassroom() {
  emit("removeFromClassroom", props.student);
}

</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-8 p-0">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem v-if="props.role === 'admin'" @click="onEdit">Edit</DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.role === 'admin'"
        class="text-red-600 focus:text-red-600 focus:bg-red-50"
        @click="onDelete"
      >
        Delete Student
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.role === 'admin' || props.role === 'instructor'"
        class="text-red-600 focus:text-red-600 focus:bg-red-50"
        @click="onRemoveFromClassroom"
      >
        Remove from Classroom
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
