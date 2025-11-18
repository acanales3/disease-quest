<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import BackwardButton from "~/components/BackwardButton/BackwardButton.vue";
import ForwardButton from "~/components/ForwardButton/ForwardButton.vue";
import StepperFlowVisual from "~/components/StepperFlowVisual/StepperFlowVisual.vue";

const steps = ["introduction", "mentor", "patient", "evaluation"] as const;
type CaseStep = (typeof steps)[number];

const route = useRoute();

// Compute current index from route
const currentIndex = computed(() => {
  const segment = route.path.split("/")[2];
  return steps.indexOf(
    steps.includes(segment as CaseStep) ? (segment as CaseStep) : "introduction"
  );
});

// Compute previous and next routes, with /admin/cases as fallback
// NEED TO BE FIXED BASED ON THE USER TOKEN - DEFAULT RIGHT NOW
const previousRoute = computed(() =>
  currentIndex.value > 0
    ? `/case/${steps[currentIndex.value - 1]}`
    : "/admin/cases"
);
const nextRoute = computed(() =>
  currentIndex.value < steps.length - 1
    ? `/case/${steps[currentIndex.value + 1]}`
    : "/admin/cases"
);
</script>

<template>
  <div class="relative min-h-screen">
    <div class="relative w-full flex justify-center mt-2">
      <!-- Stepper -->
      <StepperFlowVisual />

      <!-- Back button -->
      <div class="absolute left-10 top-1/2 -translate-y-1/2 flex justify-start">
        <BackwardButton :route="previousRoute" />
      </div>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex justify-center items-center">
      <NuxtPage />
    </div>

    <!-- Forward button -->
    <div class="absolute right-6 bottom-6">
      <ForwardButton :route="nextRoute" />
    </div>
  </div>
</template>
