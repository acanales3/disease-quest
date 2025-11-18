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

import { modalBus } from "@/components/AdminEditStudentDialog/modalBusEditStudent"

const props = defineProps<{ student: Student }>();

function onEdit() {
  modalBus.openEdit(props.student);
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
      <DropdownMenuItem @click="onEdit"> Edit </DropdownMenuItem>
      <DropdownMenuItem>Delete</DropdownMenuItem>
      <DropdownMenuItem>View Analytics</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
