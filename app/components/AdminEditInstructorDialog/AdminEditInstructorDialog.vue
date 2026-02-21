<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Classroom, ClassroomOptions } from '@/assets/interface/Classroom'
import  MultiSelect  from '@/components/ui/MultiSelect.vue'
import { ref, watch, computed, toRaw } from 'vue';
import type { Instructor } from '@/assets/interface/Instructor';


// ================================
// PROPS / EMITS
// ================================
const props = defineProps<{ show: boolean; data: Instructor | null; classrooms: ClassroomOptions[] }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', instructor: Instructor): void;
}>();



// =================================
// REACTIVE FORM DATA
// =================================
const form = ref<{
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  school: string,
  classrooms: ClassroomOptions[],
  status: 'active' | 'deactivated'
}>
  ({
  id: '',
  first_name: '',
  last_name: '',
  email: '',
  school: '',
  classrooms: [],
  status: 'active',
});

const original = ref<typeof form.value | null>(null); // Stores data prior to any changes for user review

const errors = ref({
  first_name: '',
  last_name: '',
  email: '',
  school: '',
});

// =================================================
// FORM POPULATION
// =================================================
watch(
  () => props.data,
  (newData) => {
    if (!newData) return
    const nameParts = newData.name.trim().split(/\s+/);
    form.value = {
      id: newData.id,
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' ') ?? '',
      email: newData.email,
      school: newData.school,
      status: newData.status,

      classrooms: (newData.classrooms ?? []).map(c => ({
        id: c.id,
        name: c.name,
      })),
    }

    original.value = structuredClone(toRaw(form.value)) // when modal opens store initial data
  },
  { immediate: true },
);

// ========================================
// FORM VALIDATION
// ========================================
watch(
  form,
  (val) => {
    if (!val.first_name) errors.value.first_name = 'First name is required';
    else if (val.first_name.length > 50) errors.value.first_name = '';
    else errors.value.first_name = '';

    if (!val.last_name) errors.value.last_name = 'Last name is required';
    else if (val.last_name.length > 50) errors.value.last_name = '';
    else errors.value.last_name = '';

    // email validation
    if (!val.email) {
      errors.value.email = 'Email is required';
    } else if (!val.email.endsWith('.edu')) {
      errors.value.email = 'Email must be a .edu address';
    } else {
      errors.value.email = '';
    }

    // school validation
    if (!val.school) {
      errors.value.school = 'School is required';
    } else if (val.school.length > 255) {
      errors.value.school = 'School name cannot exceed 255 characters';
    } else {
      errors.value.school = '';
    }
  },
  { deep: true, immediate: true },
);

const isInvalid = computed(() => {
  return Object.values(errors.value).some((err) => err !== '');
});


// ===========================================
// STEP STATE
// ===========================================
const STEPS = {
  FORM: "form",
  SUMMARY: "summary"
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS]

const step = ref<Step>(STEPS.FORM);
const submitted = ref(false);

const changes = computed(() => {
  if (!original.value) return []

  const diffs: Array<{
    field: string
    oldValue: any
    newValue: any
  }> = []

  for (const key of Object.keys(form.value) as (keyof typeof form.value)[]) {
    const oldVal = original.value[key]
    const newVal = form.value[key]

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal
      })
    }
  }

  return diffs
})

// ===========================================
// HANDLING
// ===========================================
const handleOpenChange = (value: boolean) => {
  if (!value) {
    step.value = STEPS.FORM

    // Reset form back to original state
    if (original.value) {
      form.value = structuredClone(original.value)
    }
    
    submitted.value = false

    emit('close');
  }
};

function onContinue() {
  submitted.value = true
  if (isInvalid.value) return
  step.value = STEPS.SUMMARY
}

function backToEdit() {
  step.value = STEPS.FORM
}

// handle save
const handleSave = async () => {
  if (isInvalid.value) return;
  if (changes.value.length == 0) return;

  emit('save', {
    id: form.value.id,
    name: `${form.value.first_name} ${form.value.last_name}`.trim(),
    email: form.value.email,
    school: form.value.school,
    classrooms: form.value.classrooms ?? [],
    status: form.value.status,
  });
  emit('close');
};


// ================================
// HELPERS
// ================================
function formatValue(val: any) {
  if (Array.isArray(val)) {
    return val.map(v => v.name ?? v).join(', ') || '-'
  }
  return val || '-'
}

</script>

<template>
  <Dialog :open="props.show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>Edit {{ original?.first_name }} {{ original?.last_name }}</DialogTitle>
        <DialogDescription>
          Make changes to the instructor's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <!-- Input Form -->
      <Transition name="fade" mode="out-in">
        <div :key="step">
          <div v-if="step === STEPS.FORM" key="form" class="flex flex-col gap-3">
            <label class="flex flex-col">
              First Name
              <input type="text" v-model="form.first_name" class="p-2 border rounded" :class=" { 'border-red-500': errors.first_name }" />
              <p v-if="errors.first_name" class="text-red-500 text-xs mt-1">{{ errors.first_name }}</p>
            </label>
            
            <label class="flex flex-col">
              Last Name
              <input type="text" v-model="form.last_name" class="p-2 border rounded" :class="{ 'border-red-500': errors.last_name }" />
              <p v-if="errors.last_name" class="text-red-500 text-xs mt-1">{{ errors.last_name }}</p>
            </label>

            <label class="flex flex-col">
              Email
              <input type="email" v-model="form.email" class="p-2 border rounded" :class="{ 'border-red-500': errors.email }" />
              <p v-if="errors.email" class="text-red-500 text-xs mt-1">
                {{ errors.email }}
              </p>
            </label>

            <label class="flex flex-col">
              School
              <input type="text" v-model="form.school" class="p-2 border rounded" :class="{ 'border-red-500': errors.school }" />
              <p v-if="errors.school" class="text-red-500 text-xs mt-1">
                {{ errors.school }}
              </p>
            </label>

            <div class="flex flex-col">
              <span class="mb-1 text-sm font-medium">
                Classroom
              </span>

              <MultiSelect
                  :items="props.classrooms.map(c => ({
                  value: String(c.id),
                  label: c.name
                }))"
                :selected="form.classrooms.map(c => ({
                  value: String(c.id),
                  label: c.name
                }))"
                :selections-label="'classrooms'"
                @update:selected="val => {
                  form.classrooms = val.map(v => ({
                    id: Number(v.value),
                    name: v.label
                  }))
                }"
              />
            </div>

            <label class="flex flex-col">
              Status
              <select v-model="form.status" class="p-2 border rounded">
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </label>
          </div>

          <div v-else key="summary" class="space-y-4 text-sm">
            <div v-if="changes.length === 0" class="text-muted-foreground">
              <strong>No changes were made.</strong>
            </div>

            <div
              v-for="change in changes"
              :key="change.field"
              class="border-b pb-3"
            >
              <div class="font-medium capitalize">
                {{ change.field.replace('_', ' ') }}
              </div>

              <div class="text-muted-foreground text-xs mt-1">
                <div>Old: {{ formatValue(change.oldValue) }}</div>
                <div>New: {{ formatValue(change.newValue) }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <DialogFooter>
        <template v-if="step === STEPS.FORM">
          <button @click="emit('close')" class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white" >Cancel</button>
          <button @click="onContinue" :disabled="isInvalid" class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed">
            Continue
          </button>
        </template>

        <template v-else>
          <button @click="backToEdit" class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white">Back to Edit</button>
          <button @click="handleSave" class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed" :disabled="changes?.length === 0">
            Confirm Changes
          </button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
