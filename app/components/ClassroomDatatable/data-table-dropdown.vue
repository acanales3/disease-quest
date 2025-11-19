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
import type { Classroom } from "./columns";

interface Props {
  classroom: Classroom;
  role: string;
}

const props = defineProps<Props>();
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
      <DropdownMenuItem v-if="props.role === 'instructor' || props.role === 'admin'">Edit</DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'admin' || props.role === 'instructor'">Delete</DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'instructor' || props.role === 'admin'">View Analytics</DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'instructor' || props.role === 'admin'">Mange Classroom</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
