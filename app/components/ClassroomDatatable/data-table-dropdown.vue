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

const emit = defineEmits<{
  edit: [classroom: Classroom];
  delete: [classroom: Classroom];
}>();

function handleEdit() {
  emit("edit", props.classroom);
}

function handleDelete() {
  emit("delete", props.classroom);
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
      <DropdownMenuItem
        v-if="props.role === 'instructor' || props.role === 'admin'"
        @click="handleEdit"
      >
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'instructor' || props.role === 'admin'">
        View Analytics
      </DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'instructor' || props.role === 'admin'">
        <NuxtLink
          :to="props.role === 'admin'
            ? `/admin/classrooms/${props.classroom.id}`
            : `/instructor/classrooms/${props.classroom.id}`"
        >
          Manage Classroom
        </NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="props.role === 'admin' || props.role === 'instructor'" />
      <DropdownMenuItem
        v-if="props.role === 'admin' || props.role === 'instructor'"
        class="text-red-600 focus:text-red-600 focus:bg-red-50"
        @click="handleDelete"
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
