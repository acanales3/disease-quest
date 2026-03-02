<script setup lang="ts">
import { computed, ref, toRaw, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Case } from "@/components/CaseDatatable/columns";

const props = defineProps<{
  show: boolean;
  data: Case | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [caseData: Case];
}>();

const form = ref<{
  id: number;
  name: string;
  description: string;
}>({
  id: 0,
  name: "",
  description: "",
});

const original = ref<typeof form.value | null>(null);
const errors = ref({
  name: "",
  description: "",
});

watch(
  form,
  (val) => {
    if (!val.name.trim()) {
      errors.value.name = "Case name is required.";
    } else {
      errors.value.name = "";
    }

    if (!val.description.trim()) {
      errors.value.description = "Case description is required.";
    } else {
      errors.value.description = "";
    }
  },
  { deep: true, immediate: true },
);

watch(
  () => props.data,
  (newData) => {
    if (!newData) return;
    form.value = {
      id: newData.id,
      name: newData.name ?? "",
      description: newData.description ?? "",
    };
    original.value = structuredClone(toRaw(form.value));
  },
  { immediate: true },
);

const STEPS = {
  FORM: "form",
  SUMMARY: "summary",
} as const;
type Step = (typeof STEPS)[keyof typeof STEPS];
const step = ref<Step>(STEPS.FORM);
const submitted = ref(false);

const isInvalid = computed(() =>
  Object.values(errors.value).some((err) => err !== ""),
);

const changes = computed(() => {
  if (!original.value) return [];

  const diffs: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }> = [];

  for (const key of Object.keys(form.value) as (keyof typeof form.value)[]) {
    if (key === "id") continue;
    const oldVal = String(original.value[key] ?? "");
    const newVal = String(form.value[key] ?? "");
    if (oldVal !== newVal) {
      diffs.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }

  return diffs;
});

let resetTimeout: number;
function resetStepState() {
  step.value = STEPS.FORM;
  submitted.value = false;
}

const handleOpenChange = (open: boolean) => {
  if (!open) {
    emit("close");
    clearTimeout(resetTimeout);
    resetTimeout = window.setTimeout(() => {
      resetStepState();
      if (original.value) {
        form.value = structuredClone(toRaw(original.value));
      }
    }, 300);
  }
};

function onContinue() {
  submitted.value = true;
  if (isInvalid.value) return;
  step.value = STEPS.SUMMARY;
}

function backToEdit() {
  step.value = STEPS.FORM;
}

function handleSave() {
  if (isInvalid.value) return;
  if (changes.value.length === 0) return;
  if (!props.data) return;

  emit("save", {
    ...props.data,
    id: form.value.id,
    name: form.value.name.trim(),
    description: form.value.description.trim(),
  });
}

watch(
  () => props.show,
  (isOpen) => {
    if (!isOpen) {
      resetStepState();
    }
  },
);

watch(
  () => props.data?.id,
  (id) => {
    if (id !== undefined && id !== null) {
      resetStepState();
    }
  },
);
</script>

<template>
  <Dialog :open="show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>Edit {{ original?.name || "Case" }}</DialogTitle>
        <DialogDescription>
          Make changes to the case details.
          <br />
          Click "confirm changes" when you are done.
        </DialogDescription>
      </DialogHeader>

      <Transition name="fade" mode="out-in">
        <div :key="step">
          <div v-if="step === STEPS.FORM" class="flex flex-col gap-3">
            <label class="flex flex-col">
              Case Name
              <input
                v-model="form.name"
                type="text"
                class="p-2 border rounded"
                :class="{ 'border-red-500': submitted && errors.name }"
              />
              <p v-if="submitted && errors.name" class="text-red-500 text-xs mt-1">
                {{ errors.name }}
              </p>
            </label>

            <label class="flex flex-col">
              Description
              <textarea
                v-model="form.description"
                rows="4"
                class="p-2 border rounded resize-y min-h-24"
                :class="{ 'border-red-500': submitted && errors.description }"
              ></textarea>
              <p
                v-if="submitted && errors.description"
                class="text-red-500 text-xs mt-1"
              >
                {{ errors.description }}
              </p>
            </label>
          </div>

          <div v-else class="space-y-4 text-sm">
            <div v-if="changes.length === 0" class="text-muted-foreground">
              <strong>No changes were made.</strong>
            </div>

            <div
              v-for="change in changes"
              :key="change.field"
              class="border-b pb-3"
            >
              <div class="font-medium capitalize">{{ change.field }}</div>
              <div class="text-muted-foreground text-xs mt-1">
                <div>Old: {{ change.oldValue || "-" }}</div>
                <div>New: {{ change.newValue || "-" }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <DialogFooter>
        <template v-if="step === STEPS.FORM">
          <button
            class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isInvalid"
            @click="onContinue"
          >
            Continue
          </button>
        </template>

        <template v-else>
          <button
            class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white"
            @click="backToEdit"
          >
            Back to Edit
          </button>
          <button
            class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="changes.length === 0"
            @click="handleSave"
          >
            Confirm Changes
          </button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
