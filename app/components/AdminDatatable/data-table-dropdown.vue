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

import type { Administrator } from "./columns";
import { modalBus } from "@/components/AdminEditAdminDialog/modalBusEditAdmin";

interface Props {
  admin: Administrator;
  role: string;
  onDelete?: (admin: Administrator) => void;
}

const props = defineProps<Props>();

function onEdit() {
  modalBus.openEdit(props.admin);
}

function onDeleteClick() {
  props.onDelete?.(props.admin);
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

      <DropdownMenuItem v-if="props.role === 'admin'" @click="onEdit">
        Edit
      </DropdownMenuItem>

      <DropdownMenuItem v-if="props.role === 'admin'" class="text-red-600 focus:text-red-600 focus:bg-red-50" @click="onDeleteClick">
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
