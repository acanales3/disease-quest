<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

definePageMeta({
  layout: "instructor",
});

const STEPS = {
  FORM: "form",
  SUMMARY: "summary",
} as const;

type Step = typeof STEPS[keyof typeof STEPS];

const router = useRouter();
const step = ref<Step>(STEPS.FORM);

const form = ref({
  title: "",
  code: "",
  section: "",
  term: "",
  startDate: "",
  endDate: "",
});

type FormField = keyof typeof form.value;

const fields: Array<{ id: FormField; label: string; placeholder: string }> = [
  { id: "title", label: "Course Title", placeholder: "DiseaseQuest 101" },
  { id: "code", label: "Course Code", placeholder: "BIOL 10123" },
  { id: "section", label: "Section", placeholder: "001" },
  { id: "term", label: "Term", placeholder: "Fall 2025" },
];

const cardDescription = computed(() =>
  step.value === STEPS.FORM
    ? "Enter the details of the classroom you would like to create."
    : "Review the classroom information before creating it."
);

function onContinue() {
  const missing = Object.entries(form.value).filter(([_, v]) => !v);
  if (missing.length > 0) {
    alert("Please fill in all fields before continuing.");
    return;
  }
  step.value = STEPS.SUMMARY;
}

function backToEdit() {
  step.value = STEPS.FORM;
}

async function createClassroom() {
  try {
    console.log("Creating classroom with data:", form.value);
    router.push("/instructor/classrooms");
  } catch (error) {
    console.error("Failed to create classroom:", error);
  }
}

function onCancel() {
  router.push("/instructor/classrooms");
}
</script>

<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <Card>
      <CardHeader>
        <CardTitle>Create Classroom</CardTitle>
        <CardDescription>{{ cardDescription }}</CardDescription>
      </CardHeader>

      <CardContent>
        <Transition name="fade" mode="out-in">
          <div v-if="step === STEPS.FORM" key="form" class="grid gap-6 py-4">
            <div
              v-for="field in fields"
              :key="field.id"
              class="grid grid-cols-4 items-center gap-4"
            >
              <Label :for="field.id" class="text-right">
                {{ field.label }}
              </Label>
              <Input
                :id="field.id"
                v-model="form[field.id]"
                class="col-span-3"
                :placeholder="field.placeholder"
              />
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="startDate" class="text-right"> Start Date </Label>
              <Input
                id="startDate"
                type="date"
                v-model="form.startDate"
                class="col-span-3"
              />
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="endDate" class="text-right"> End Date </Label>
              <Input
                id="endDate"
                type="date"
                v-model="form.endDate"
                class="col-span-3"
              />
            </div>
          </div>

          <div v-else key="summary" class="grid gap-4 py-4 text-sm">
            <div
              v-for="(value, key) in form"
              :key="key"
              class="flex justify-between border-b pb-3"
            >
              <span class="font-medium capitalize">
                {{ key.replace(/([A-Z])/g, ' $1') }}:
              </span>
              <span>{{ value || "—" }}</span>
            </div>
          </div>
        </Transition>

        <div class="flex justify-end gap-3 mt-6 pt-6 border-t">
          <template v-if="step === STEPS.FORM">
            <Button variant="outline" type="button" @click="onCancel">
              Cancel
            </Button>
            <Button type="button" @click="onContinue"> Continue </Button>
          </template>

          <!-- read only summary -->
          <template v-else>
            <Button variant="outline" type="button" @click="backToEdit">
              Back to Edit
            </Button>
            <Button type="button" @click="createClassroom">
              Create Classroom
            </Button>
          </template>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
