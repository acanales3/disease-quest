<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import {
  BookOpen,
  MessageCircleMore,
  MessageCircleDashed,
  BookLock,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();

// Define steps with slugs
const steps = [
  {
    step: 1,
    title: "Introduction",
    description: "Read Up on Your Case",
    icon: BookOpen,
    slug: "introduction",
  },
  {
    step: 2,
    title: "Mentor Conversation",
    description: "Speak with your mentor",
    icon: MessageCircleDashed,
    slug: "mentor",
  },
  {
    step: 3,
    title: "Patient Conversation",
    description: "Speak with your Patient",
    icon: MessageCircleMore,
    slug: "patient",
  },
  {
    step: 4,
    title: "Feedback and Evaluation",
    description: "Receive your Feedback",
    icon: BookLock,
    slug: "evaluation",
  },
];

// Get current step from route
const currentStepIndex = computed(() => {
  const segment = route.path.split("/")[2];
  const index = steps.findIndex((s) => s.slug === segment);
  return index >= 0 ? index : 0;
});

// Navigate to step
const goToStep = (slug: string) => {
  router.push(`/case/${slug}`);
};
</script>

<template>
  <div class="mt-3 flex w-full justify-center">
    <div class="flex w-full max-w-[95%] items-start gap-3">
      <div
        v-for="(step, index) in steps"
        :key="step.step"
        class="relative flex w-full flex-col items-center justify-center cursor-pointer"
        @click="goToStep(step.slug)"
      >
        <!-- Step Indicator -->
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          :class="
            index <= currentStepIndex
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          "
        >
          <component :is="step.icon" class="w-5 h-5" />
        </div>

        <!-- Connector Line -->
        <div
          v-if="index !== steps.length - 1"
          class="absolute left-[calc(50%+24px)] right-[calc(-50%+16px)] top-5 h-0.5 rounded-full"
          :class="index < currentStepIndex ? 'bg-primary' : 'bg-muted'"
        ></div>

        <!-- Labels -->
        <div class="flex flex-col items-center mt-2">
          <div
            class="text-xs font-medium"
            :class="
              index <= currentStepIndex
                ? 'text-primary'
                : 'text-muted-foreground'
            "
          >
            {{ step.title }}
          </div>
          <div class="text-[11px] text-muted-foreground">
            {{ step.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
