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

const onEdit = () => {
  emit("edit", props.caseData);
};

const onDelete = () => {
  emit("delete", props.caseData);
};

const onRemoveFromClassroom = () => {
  emit("removeFromClassroom", Number(props.caseData.id));
};

const onRemoveFromClassrooms = () => {
  emit("removeFromClassrooms", props.caseData);
};

const isReplaying = ref(false);

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
    // If classroomId is provided as a prop (from dashboard) or part of the caseData, pass it in URL
    const id = props.classroomId || (props.caseData as any).classroomId;
    if (id) {
      router.push(`/case/${props.caseData.id}/introduction?classroomId=${id}`);
    } else {
      router.push(`/case/${props.caseData.id}/introduction`);
    }
  }
};

const handleReplay = async () => {
  isReplaying.value = true;

  try {
    // Look up the most recent completed session for this case
    const activeRes = await $fetch<{ sessionId: string | null }>(
      `/api/sessions/active?caseId=${props.caseData.id}&includeCompleted=true`,
    );

    if (!activeRes.sessionId) {
      // No session found — nothing to reset, just emit refresh so the
      // parent re-fetches and the row shows the correct state
      emit("refresh");
      return;
    }

    // Reset the completed session in the database
    await $fetch("/api/sessions/replay", {
      method: "POST",
      body: { sessionId: activeRes.sessionId },
    });

    // Tell the parent table to re-fetch cases so this row updates
    // from "completed / Replay" → "not started / Begin" without any navigation
    emit("refresh");
  } catch (err) {
    console.error("Replay failed:", err);
    // Still emit refresh so the UI isn't left in a stale state
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
        v-if="props.caseData.status === 'completed'"
        class="cursor-pointer"
        @click="router.push(`/case/${props.caseData.id}/results`)"
      >
        Review Case
      </DropdownMenuItem>
      <DropdownMenuItem v-if="props.role === 'admin'" class="cursor-pointer" @click="onEdit">
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="(props.role === 'admin' || props.role === 'instructor') && props.classroomId"
        @click="onRemoveFromClassroom"
      >
        Remove from Classroom
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="(props.role === 'admin' || props.role === 'instructor') && !props.classroomId && props.caseData.classrooms?.length"
        @click="onRemoveFromClassrooms"
      >
        Remove from Classroom
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="props.role === 'admin'"
        class="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
        @click="onDelete"
      >
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

