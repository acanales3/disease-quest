<script setup lang="ts">
import {
  BookOpen,
  MessageCircleMore,
  MessageCircleDashed,
  BookLock,
} from "lucide-vue-next";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";

const steps = [
  {
    step: 1,
    title: "Introduction",
    description: "Read Up on Your Case",
    icon: BookOpen,
  },
  {
    step: 2,
    title: "Mentor Conversation",
    description: "Speak with your mentor",
    icon: MessageCircleDashed,
  },
  {
    step: 3,
    title: "Patient Conversation",
    description: "Speak with your Patient",
    icon: MessageCircleMore,
  },
  {
    step: 4,
    title: "Feedback and Evaluation",
    description: "Recieve your Feedback",
    icon: BookLock,
  },
];
</script>

<template>
  <div class="mt-3 flex w-full justify-center">
    <Stepper class="flex w-full max-w-[95%] items-start gap-3">
      <StepperItem
        v-for="item in steps"
        :key="item.step"
        :step="item.step"
        class="relative flex w-full flex-col items-center justify-center"
      >
        <StepperTrigger>
          <StepperIndicator v-slot="{ step }" class="bg-muted w-10 h-10">
            <template v-if="item.icon">
              <component :is="item.icon" class="w-5 h-5" />
              <!-- icons slightly smaller -->
            </template>
            <span v-else>{{ step }}</span>
          </StepperIndicator>
        </StepperTrigger>

        <StepperSeparator
          v-if="item.step !== steps[steps.length - 1]?.step"
          class="absolute left-[calc(50%+24px)] right-[calc(-50%+16px)] top-6 block h-0.5 rounded-full bg-muted group-data-[state=completed]:bg-primary"
        />

        <div class="flex flex-col items-center">
          <StepperTitle class="text-xs font-medium">
            {{ item.title }}
          </StepperTitle>
          <StepperDescription class="text-[11px] text-muted-foreground">
            {{ item.description }}
          </StepperDescription>
        </div>
      </StepperItem>
    </Stepper>
  </div>
</template>
