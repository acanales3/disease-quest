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
}

const props = defineProps<Props>();

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

      <DropdownMenuItem>
        <NuxtLink :to="`/case/introduction`">
          {{ getButtonText() }}
        </NuxtLink>
      </DropdownMenuItem>

      <DropdownMenuItem v-if="props.role === 'admin'"> Edit </DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'admin'">Delete</DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'student' && props.caseData.status === 'completed'">Review Case</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>