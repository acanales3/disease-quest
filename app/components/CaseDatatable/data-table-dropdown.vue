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
import type { Case } from "./columns";

interface Props {
  caseData: Case;
  role: string;
  onEdit?: (caseData: Case) => void;
  onDelete?: (caseData: Case) => void;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [caseData: Case];
  delete: [caseData: Case];
}>();

function handleEdit() {
  emit("edit", props.caseData);
  props.onEdit?.(props.caseData);
}

function handleDelete() {
  emit("delete", props.caseData);
  props.onDelete?.(props.caseData);
}

// Determine button text and action based on case status
const getButtonText = () => {
  switch (props.caseData.status) {
    case "not started":
      return "Begin";
    case "in progress":
      return "Continue";
    case "completed":
      return "Replay";
    default:
      return "Begin";
  }
};
</script>

<!-- eventually want to make this dynmaic where the actions shown are based on the role of the user -->
<!-- for now, we will just show the same actions for all users (Play, Edit, Delete) -->
<!-- we will also need to make the actions do something by emitting events -->

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

      <NuxtLink :to="`/case/${props.caseData.id}/introduction`">
        <DropdownMenuItem>
          {{ getButtonText() }}
        </DropdownMenuItem>
      </NuxtLink>

      <DropdownMenuItem v-if="props.role === 'admin'" @click="handleEdit">
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.role === 'admin'"
        class="text-red-600 focus:text-red-600 focus:bg-red-50"
        @click="handleDelete"
      >
        Delete
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.role === 'student' && props.caseData.status === 'completed'"
        >Review Case</DropdownMenuItem
      >
    </DropdownMenuContent>
  </DropdownMenu>
</template>
