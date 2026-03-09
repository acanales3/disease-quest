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
import { caseEvaluationModalBus } from "../CaseEvaluationModal/modalBusCaseEvaluation";

interface Props {
  caseData: Case;
  role: string;
  classroomId?: number;
  returnTo?: string;
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

const onEdit = () => emit("edit", props.caseData);
const onDelete = () => emit("delete", props.caseData);
const onRemoveFromClassroom = () => emit("removeFromClassroom", Number(props.caseData.id));
const onRemoveFromClassrooms = () => emit("removeFromClassrooms", props.caseData);

const isReplaying = ref(false);

const getButtonText = () => {
  switch (props.caseData.status) {
    case "not started": return "Begin";
    case "in progress": return "Continue";
    case "completed": return "Replay";
    default: return "Begin";
  }
};

const resolvedClassroomId = computed(
  () => props.classroomId ?? (props.caseData as any).classroomId ?? (props.caseData as any).classroom_id ?? null,
);

// Step key scoped to (caseId, classroomId) so the same case in two classrooms
// remembers independent steps.
function stepStorageKey(caseId: number | string) {
  return resolvedClassroomId.value
    ? `dq_case_step_${caseId}_cls_${resolvedClassroomId.value}`
    : `dq_case_step_${caseId}`;
}

const handlePrimaryAction = async () => {
  if (props.caseData.status === "completed") {
    await handleReplay();
  } else {
    const caseId = Number(props.caseData.id);
    const params = new URLSearchParams();
    if (resolvedClassroomId.value) params.set("classroomId", String(resolvedClassroomId.value));
    if (props.returnTo) params.set("returnTo", props.returnTo);

    let step = "introduction";
    if (props.caseData.status === "in progress" && import.meta.client) {
      const saved = localStorage.getItem(stepStorageKey(caseId));
      if (saved && ["introduction", "mentor", "patient", "evaluation"].includes(saved)) {
        step = saved;
      }
    }
    const query = params.toString();
    router.push(`/case/${caseId}/${step}${query ? `?${query}` : ""}`);
  }
};

function sessionStorageKey(caseId: number | string) {
  return resolvedClassroomId.value
    ? `dq_session_${caseId}_cls_${resolvedClassroomId.value}`
    : `dq_session_${caseId}`;
}

const handleReplay = async () => {
  isReplaying.value = true;

  try {
    const activeParams = new URLSearchParams({
      caseId: String(props.caseData.id),
      includeCompleted: "true",
    });
    if (resolvedClassroomId.value) {
      activeParams.set("classroomId", String(resolvedClassroomId.value));
    }

    const activeRes = await $fetch<{ sessionId: string | null }>(
      `/api/sessions/active?${activeParams.toString()}`,
    );

    if (!activeRes.sessionId) {
      emit("refresh");
      return;
    }

    const replayRes = await $fetch<{ sessionId: string }>("/api/sessions/replay", {
      method: "POST",
      body: { sessionId: activeRes.sessionId },
    });

    if (import.meta.client) {
      localStorage.removeItem(stepStorageKey(props.caseData.id));
      if (replayRes.sessionId) {
        localStorage.setItem(sessionStorageKey(props.caseData.id), replayRes.sessionId);
      }
    }

    emit("refresh");
  } catch (err) {
    console.error("Replay failed:", err);
    emit("refresh");
  } finally {
    isReplaying.value = false;
  }
};

const openEvaluationModal = async () => {
  let sessionId = (props.caseData as any).sessionId ?? null;

  if (!sessionId) {
    try {
      const activeRes = await $fetch<{ sessionId: string | null }>(
        `/api/sessions/active?caseId=${props.caseData.id}&includeCompleted=true`
      );
      sessionId = activeRes.sessionId;
    } catch (err) {
      console.error("Could not find session for case:", err);
      return;
    }
  }

  if (!sessionId) return;

  const classroomId = props.classroomId ?? props.caseData.classrooms?.[0]?.id ?? 0;

  caseEvaluationModalBus.open(
    Number(props.caseData.id),
    classroomId,
    sessionId
  );
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
        @click="openEvaluationModal"
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