<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
import StepperFlowVisual from "~/components/StepperFlowVisual/StepperFlowVisual.vue";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-vue-next";

const steps = ["introduction", "mentor", "patient", "evaluation"] as const;
type CaseStep = (typeof steps)[number];

const route = useRoute();
const router = useRouter();

const caseId = computed(() => route.params.caseId as string);
const currentStep = computed(() => route.path.split("/")[3] as CaseStep);
const currentIndex = computed(() => {
  return steps.indexOf(
    steps.includes(currentStep.value) ? currentStep.value : "introduction"
  );
});

// classroomId from URL query — present for students, absent for admin/instructor
const classroomId = computed(() =>
  route.query.classroomId ? String(route.query.classroomId) : null
);

// Step key scoped to (caseId, classroomId) so the same case in two classrooms
// saves independent step positions.
const stepStorageKey = computed(() =>
  classroomId.value
    ? `dq_case_step_${caseId.value}_cls_${classroomId.value}`
    : `dq_case_step_${caseId.value}`
);

const queryString = computed(() => {
  const q = route.query;
  if (!q || !Object.keys(q).length) return "";
  return "?" + new URLSearchParams(q as Record<string, string>).toString();
});

const previousRoute = computed(() => {
  if (currentIndex.value > 0) {
    return `/case/${caseId.value}/${steps[currentIndex.value - 1]}${queryString.value}`;
  }
  return (route.query.returnTo as string) || "/student/cases";
});

const nextRoute = computed(() =>
  currentIndex.value < steps.length - 1
    ? `/case/${caseId.value}/${steps[currentIndex.value + 1]}${queryString.value}`
    : (route.query.returnTo as string) || "/student/cases"
);

function saveProgressAndGoBack() {
  if (import.meta.client && caseId.value) {
    localStorage.setItem(stepStorageKey.value, currentStep.value);
  }
  const returnTo = (route.query.returnTo as string) || "/student/cases";
  router.push(returnTo);
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Top bar: exit button -->
    <div class="w-full flex items-center justify-between px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-gray-600 hover:text-gray-900"
        @click="saveProgressAndGoBack"
      >
        <ArrowLeft class="w-4 h-4" />
        Save &amp; Exit
      </Button>
    </div>

    <!-- Stepper header -->
    <div class="relative w-full flex justify-center py-6 border-b bg-white flex-shrink-0">
      <StepperFlowVisual />

      <div class="absolute left-10 top-1/2 -translate-y-1/2">
        <BackwardButton :route="previousRoute" :disabled="currentIndex === 0" />
      </div>

      <div class="absolute right-10 top-1/2 -translate-y-1/2">
        <ForwardButton :route="nextRoute" :disabled="currentIndex === steps.length - 1" />
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1">
      <NuxtPage />
    </div>
  </div>
</template>