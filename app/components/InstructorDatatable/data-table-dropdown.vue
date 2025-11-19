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
import type { Instructor } from "./columns";
import { modalBus } from "@/components/AdminEditInstructorDialog/modalBusEditInstructor";

interface Props {
  instructor: Instructor;
  role: string;
}

const props = defineProps<Props>();

function onEdit() {
  modalBus.openEdit(props.instructor);
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
      <DropdownMenuItem v-if="props.role === 'admin'" @click="onEdit">Edit</DropdownMenuItem>
      <DropdownMenuSeparator v-if="props.role === 'admin'" />
      <DropdownMenuItem v-if="props.role === 'admin'">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
