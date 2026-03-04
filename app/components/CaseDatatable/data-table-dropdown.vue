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
  classroomId?: number;
}

const props = defineProps<Props>();
const router = useRouter();

const emit = defineEmits<{
  (e: "edit", caseData: Case): void;
  (e: "delete", caseData: Case): void;
  (e: "removeFromClassroom", caseId: number): void;
  (e: "removeFromClassrooms", caseData: Case): void;
  (e: "refresh"): void;
}>();

const isReplaying = ref(false);

function onEdit() {
  emit("edit", props.caseData);
}

function onDelete() {
  emit("delete", props.caseData);
}

function onRemoveFromClassroom() {
  emit("removeFromClassroom", props.caseData.id as number);
}

function onRemoveFromClassrooms() {
  emit("removeFromClassrooms", props.caseData);
}

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

const handlePrimaryAction = async () => {
  if (props.caseData.status === "completed") {
    await handleReplay();
  } else {
    router.push(`/case/${props.caseData.id}/introduction`);
  }
};

const handleReplay = async () => {
  isReplaying.value = true;

  try {
    const activeRes = await $fetch<{ sessionId: string | null }>(
      `/api/sessions/active?caseId=${props.caseData.id}&includeCompleted=true`,
    );

    if (!activeRes.sessionId) {
      emit("refresh");
      return;
    }

    await $fetch("/api/sessions/replay", {
      method: "POST",
      body: { sessionId: activeRes.sessionId },
    });

    emit("refresh");
  } catch (err) {
    console.error("Replay failed:", err);
    emit("refresh");
  } finally {
    isReplaying.value = false;
  }
};
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
        :disabled="isReplaying"
        class="cursor-pointer"
        @click="handlePrimaryAction"
      >
        <span v-if="isReplaying">Resetting...</span>
        <span v-else>{{ getButtonText() }}</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        v-if="props.role === 'admin'"
        class="cursor-pointer"
        @click="onEdit"
      >
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.role === 'admin'"
        class="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        @click="onDelete"
      >
        Delete
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="(props.role === 'admin' || props.role === 'instructor') && props.classroomId"
        class="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        @click="onRemoveFromClassroom"
      >
        Remove from Classroom
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="(props.role === 'admin' || props.role === 'instructor') && !props.classroomId && props.caseData.classrooms?.length"
        class="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        @click="onRemoveFromClassrooms"
      >
        Remove from Classroom
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.caseData.status === 'completed'"
        class="cursor-pointer"
        @click="router.push(`/case/${props.caseData.id}/results`)"
      >
        Review Case
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
