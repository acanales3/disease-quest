<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
import StepperFlowVisual from "~/components/StepperFlowVisual/StepperFlowVisual.vue";

const steps = ["introduction", "mentor", "patient", "evaluation"] as const;
type CaseStep = (typeof steps)[number];

const route = useRoute();

// Get caseId from route
const caseId = computed(() => route.params.caseId as string);

// Compute current step from route
const currentStep = computed(() => route.path.split("/")[3] as CaseStep);

// Current step index
const currentIndex = computed(() => {
  return steps.indexOf(
    steps.includes(currentStep.value) ? currentStep.value : "introduction"
  );
});

// Previous / Next routes (include caseId)
const previousRoute = computed(() =>
  currentIndex.value > 0
    ? `/case/${caseId.value}/${steps[currentIndex.value - 1]}`
    : "/admin/cases"
);

const nextRoute = computed(() =>
  currentIndex.value < steps.length - 1
    ? `/case/${caseId.value}/${steps[currentIndex.value + 1]}`
    : "/admin/cases"
);
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Stepper header -->
    <div class="relative w-full flex justify-center py-6 border-b bg-white flex-shrink-0">
      <StepperFlowVisual />

      <div class="absolute left-10 top-1/2 -translate-y-1/2">
        <BackwardButton :route="previousRoute" />
      </div>

      <div class="absolute right-10 top-1/2 -translate-y-1/2">
        <ForwardButton :route="nextRoute" />
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1">
      <NuxtPage />
    </div>
  </div>
</template>
