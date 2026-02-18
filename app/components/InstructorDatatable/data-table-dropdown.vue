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
import type { Instructor } from "@/components/InstructorDatatable/columns";
import { modalBus } from "@/components/AdminEditInstructorDialog/modalBusEditInstructor";

interface Props {
  instructor: Instructor;
  role: string;
  onDelete?: (instructor: Instructor) => void; 
}

const props = defineProps<Props>();

function onEdit() {
  modalBus.openEdit({
    id: props.instructor.id,
    name: props.instructor.name,
    email: props.instructor.email,
    school: props.instructor.school,
    classrooms: props.instructor.classrooms,
    status: props.instructor.status as "active" | "deactivated",
  });
}

function onDeleteClick() {
  // This does NOT delete. It just tells the parent to open the modal.
  console.log("DROPDOWN DELETE CLICKED", props.instructor.id, !!props.onDelete);
  props.onDelete?.(props.instructor);
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

      <DropdownMenuItem v-if="props.role === 'admin'"class="text-red-600 focus:text-red-600 focus:bg-red-50" @click="onDeleteClick">
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
