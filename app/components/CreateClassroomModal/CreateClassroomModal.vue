<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
import {
  validateClassroomDetails,
  type ClassroomFormData,
  type ClassroomFormErrors,
} from "@/utils/validateClassroomDetails";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'created': [response: { id: number; inviteCode: string; [key: string]: any }];
  'cancel': [];
}>();

const STEPS = {
  FORM: "form",
  SUMMARY: "summary",
} as const;

type Step = typeof STEPS[keyof typeof STEPS];

const step = ref<Step>(STEPS.FORM);
const isLoading = ref(false);
const apiError = ref("");

const form = ref<ClassroomFormData>({
  name: "",
  code: "",
  section: "",
  term: "",
  startDate: "",
  endDate: "",
});

type FormField = keyof ClassroomFormData;

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

// ── Validation ──────────────────────────────────────────────────────────────

const errors = ref<ClassroomFormErrors>({});

/** Tracks which fields the user has interacted with (blur). */
const touched = ref<Record<FormField, boolean>>({
  name: false,
  code: false,
  section: false,
  term: false,
  startDate: false,
  endDate: false,
});

/** Set to true once the user clicks "Continue" so all errors show. */
const submitted = ref(false);

// Re-validate whenever the form changes (immediate so errors are populated from the start)
watch(
  form,
  (val) => {
    const result = validateClassroomDetails(val);
    errors.value = result.success ? {} : result.errors;
  },
  { deep: true, immediate: true },
);

/** Whether the entire form is invalid. */
const isInvalid = computed(() => {
  const result = validateClassroomDetails(form.value);
  return !result.success;
});

/** Should we display the error for a specific field? */
function showError(field: FormField): boolean {
  return (touched.value[field] || submitted.value) && !!errors.value[field];
}

function markTouched(field: FormField) {
  touched.value[field] = true;
}

function markAllTouched() {
  for (const key of Object.keys(touched.value) as FormField[]) {
    touched.value[key] = true;
  }
}

// ── Step navigation ─────────────────────────────────────────────────────────

function onContinue() {
  submitted.value = true;
  markAllTouched();
  if (isInvalid.value) return;
  step.value = STEPS.SUMMARY;
}

function backToEdit() {
  step.value = STEPS.FORM;
}

// ── Create ──────────────────────────────────────────────────────────────────

async function createClassroom() {
  if (isLoading.value) return;
  isLoading.value = true;
  apiError.value = "";

  try {
    const response = await $fetch<{ id: number; inviteCode: string }>("/api/classrooms", {
      method: "POST",
      body: {
        name: form.value.name.trim(),
        code: form.value.code.trim(),
        section: form.value.section.trim(),
        term: form.value.term.trim(),
        startDate: form.value.startDate,
        endDate: form.value.endDate,
      },
    });

    emit("created", response);
    resetForm();
    emit("update:open", false);
  } catch (error: any) {
    apiError.value =
      error?.data?.message ||
      error?.statusMessage ||
      "Failed to create classroom. Please try again.";
  } finally {
    isLoading.value = false;
  }
}

// ── Cancel ──────────────────────────────────────────────────────────────────

function onCancel() {
  resetForm();
  emit("update:open", false);
  emit("cancel");
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
  errors.value = {};
  touched.value = {
    name: false,
    code: false,
    section: false,
    term: false,
    startDate: false,
    endDate: false,
  };
  submitted.value = false;
  step.value = STEPS.FORM;
  apiError.value = "";
  isLoading.value = false;
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Classroom</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <p
        v-if="submitted && isInvalid && step === STEPS.FORM"
        class="text-red-500 text-sm text-center mt-1"
      >
        Please complete all required fields before continuing.
      </p>

      <div>
        <Transition name="fade" mode="out-in">
          <!-- ─── FORM STEP ─────────────────────────────────────────── -->
          <div v-if="step === STEPS.FORM" key="form" class="grid gap-6 py-2">
            <div
              v-for="field in fields"
              :key="field.id"
              class="grid grid-cols-4 items-start gap-4"
            >
              <Label :for="field.id" class="text-right pt-2">
                {{ field.label }}
              </Label>
              <div class="col-span-3">
                <Input
                  :id="field.id"
                  v-model="form[field.id]"
                  :placeholder="field.placeholder"
                  :class="{ 'border-red-500': showError(field.id) }"
                  @blur="markTouched(field.id)"
                />
                <p
                  v-if="showError(field.id)"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ errors[field.id] }}
                </p>
              </div>
            </div>

            <!-- Start Date -->
            <div class="grid grid-cols-4 items-start gap-4">
              <Label for="startDate" class="text-right pt-2">
                Start Date
              </Label>
              <div class="col-span-3">
                <Input
                  id="startDate"
                  type="date"
                  v-model="form.startDate"
                  :class="{ 'border-red-500': showError('startDate') }"
                  @blur="markTouched('startDate')"
                />
                <p
                  v-if="showError('startDate')"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ errors.startDate }}
                </p>
              </div>
            </div>

            <!-- End Date -->
            <div class="grid grid-cols-4 items-start gap-4">
              <Label for="endDate" class="text-right pt-2">
                End Date
              </Label>
              <div class="col-span-3">
                <Input
                  id="endDate"
                  type="date"
                  v-model="form.endDate"
                  :class="{ 'border-red-500': showError('endDate') }"
                  @blur="markTouched('endDate')"
                />
                <p
                  v-if="showError('endDate')"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ errors.endDate }}
                </p>
              </div>
            </div>
          </div>

          <!-- ─── SUMMARY STEP ──────────────────────────────────────── -->
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

            <!-- API error banner (only visible on summary step) -->
            <div
              v-if="apiError"
              class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm"
            >
              {{ apiError }}
            </div>
          </div>
        </Transition>

        <!-- ─── ACTIONS ───────────────────────────────────────────── -->
        <div class="flex justify-end gap-3 mt-6 pt-6 border-t">
          <template v-if="step === STEPS.FORM">
            <Button variant="outline" type="button" @click="onCancel">
              Cancel
            </Button>
            <Button
              type="button"
              :disabled="submitted && isInvalid"
              @click="onContinue"
            >
              Continue
            </Button>
          </template>

          <!-- Summary actions -->
          <template v-else>
            <Button
              variant="outline"
              type="button"
              :disabled="isLoading"
              @click="backToEdit"
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              :disabled="isLoading"
              @click="createClassroom"
            >
              <template v-if="isLoading">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating…
              </template>
              <template v-else>
                Create Classroom
              </template>
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
