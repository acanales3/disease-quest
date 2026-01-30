<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'created': [classroom: typeof form.value];
}>();

const STEPS = {
  FORM: "form",
  SUMMARY: "summary",
} as const;

type Step = typeof STEPS[keyof typeof STEPS];

const step = ref<Step>(STEPS.FORM);

const form = ref({
  name: "",
  code: "",
  section: "",
  term: "",
  startDate: "",
  endDate: "",
});

type FormField = keyof typeof form.value;

const fields: Array<{ id: FormField; label: string; placeholder: string }> = [
  { id: "name", label: "Course Title", placeholder: "DiseaseQuest 101" },
  { id: "code", label: "Course Code", placeholder: "BIOL 10123" },
  { id: "section", label: "Section", placeholder: "001" },
  { id: "term", label: "Term", placeholder: "Fall 2025" },
];

const dialogDescription = computed(() =>
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
    emit('created', form.value);
    resetForm();
    emit('update:open', false);
  } catch (error) {
    console.error("Failed to create classroom:", error);
  }
}

function onCancel() {
  resetForm();
  emit('update:open', false);
}

function resetForm() {
  form.value = {
    name: "",
    code: "",
    section: "",
    term: "",
    startDate: "",
    endDate: "",
  };
  step.value = STEPS.FORM;
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Classroom</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <div class="mt-4">
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

          <!-- Read only summary -->
          <template v-else>
            <Button variant="outline" type="button" @click="backToEdit">
              Back to Edit
            </Button>
            <Button type="button" @click="createClassroom">
              Create Classroom
            </Button>
          </template>
        </div>
      </div>
    </DialogContent>
  </Dialog>
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

