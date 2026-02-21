<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Classroom, ClassroomOptions } from '@/assets/interface/Classroom'
import { toRaw, ref, watch } from 'vue';

import MultiSelect from '@/components/ui/MultiSelect.vue'
import type { Student } from '~/assets/interface/Student';

const props = defineProps<{ show: boolean; data: Student; classrooms: ClassroomOptions[] }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', student: Student): void;
}>();

// =========================================
// REACTIVE FORM DATA
// =========================================
const form = ref<{
  id: string,
  userId: string,
  first_name: string,
  last_name: string,
  nickname: string,
  email: string,
  school: string,
  msyear: number,
  classrooms: ClassroomOptions[],
  status: string
}>({
  id: '',
  userId: '',
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  school: '',
  msyear: 1,
  classrooms: [],
  status: 'registered',
});

const original = ref<typeof form.value | null>(null); // Stores data prior to any changes for user review

const errors = ref({
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  school: '',
});


// =======================================
// INPUT VALIDATION
// =======================================
watch(
  form,
  (val) => {
    // name validation
    if (!val.first_name) {
      errors.value.first_name = 'First name is required.';
    } else if (val.first_name.length > 100) {
      errors.value.first_name = 'First names cannot exceed 100 characters'
    } else {
      errors.value.first_name = '';
    }

    if (!val.last_name) {
      errors.value.last_name = 'Last name is required.';
    } else if (val.last_name.length > 100) {
      errors.value.last_name = 'Last names cannot exceed 100 characters'
    } else {
      errors.value.last_name = '';
    }

    // nickname validation
    if (!val.nickname) {
      errors.value.nickname = 'Nickname is required.';
    } else if (val.nickname.length > 30) {
      errors.value.nickname = 'Nickname cannot exceed 30 characters'
    } else {
      errors.value.nickname = '';
    }

    // email validation
    if (!val.email) {
      errors.value.email = 'Email is required.';
    } else if (!val.email.endsWith('.edu')) {
      errors.value.email = 'Email must be a .edu address.';
    } else {
      errors.value.email = '';
    }

    // school validation
    if (!val.school) {
      errors.value.school = 'School is required.';
    } else if (val.school.length > 255) {
      errors.value.school = 'School name cannot exceed 255 characters'
    } else {
      errors.value.school = '';
    }
  },
  { deep: true, immediate: true },
);

// ========================================
// FORM POPULATION
// ========================================
watch(
  () => props.data, 
  (newData) => {
    if (!newData) return
    const nameParts = newData.name.trim().split(/\s+/);

    console.log('MultiSelect selected:', form.value.classrooms.map(c => ({ value: String(c.id), label: c.name })));
    form.value = {
      id: newData.id,
      userId: newData.userId,
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' ') ?? '',
      nickname: newData.nickname,
      email: newData.email,
      school: newData.school,
      msyear: newData.msyear,
      classrooms: (newData.classrooms ?? []).map(c => ({
        id: c.id,
        name: c.name,
      })),
      status: newData.status
    }

      original.value = structuredClone(toRaw(form.value))
  }, { immediate: true },
);

const isInvalid = computed(() => {
  return Object.values(errors.value).some((err) => err !== '');
});


// =======================================
// STEP STATE
// =======================================
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

// ========================================
// HANDLING
// ========================================

// handle dialog close
let resetTimeout: number
const handleOpenChange = (value: boolean) => {
  if (!value) {
    emit('close');
    // Set a small timeout to prevent user from seeing step change. Kind of a hack, but this is better than setting a watcher
    // on props.show
    clearTimeout(resetTimeout)
    resetTimeout = window.setTimeout(() => {
      step.value = STEPS.FORM;
      if (original.value) {
        form.value = structuredClone(toRaw(original.value));
      }
      submitted.value = false;
    }, 400);
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
const handleSave = () => {
  if (isInvalid.value) return;
  if (changes.value.length === 0) return;

  emit('save', { 
    ...form.value,
    userId: form.value.userId
   });

  emit('close');
  // Set a small timeout to prevent user from seeing step change. Kind of a hack, but this is better than setting a watcher
  // on props.show
  clearTimeout(resetTimeout)
  resetTimeout = window.setTimeout(() => {
    step.value = STEPS.FORM;
    if (original.value) {
      form.value = structuredClone(toRaw(original.value));
    }
    submitted.value = false;
  }, 400);
};

// ===============================
// HELPERS
// ===============================
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
          Make changes to the student's profile here.
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
              <input type="text" v-model="form.first_name" class="p-2 border rounded" :class="{ 'border-red-500': errors.first_name }" />
              <p v-if="errors.first_name" class="text-red-500 text-xs mt-1">
                {{ errors.first_name }}
              </p>
            </label>

            <label class="flex flex-col">
              Last Name
              <input type="text" v-model="form.last_name" class="p-2 border rounded" :class="{ 'border-red-500': errors.last_name }" />
              <p v-if="errors.last_name" class="text-red-500 text-xs mt-1">{{ errors.last_name }}</p>
            </label>

            <label class="flex flex-col">
              Nickname
              <input type="text" v-model="form.nickname" class="p-2 border rounded" :class="{ 'border-red-500': errors.nickname }" />
              <p v-if="errors.nickname" class="text-red-500 text-xs mt-1">
                {{ errors.nickname }}
              </p>
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

            <label class="flex flex-col">
              MS Year
              <input type="number" v-model.number="form.msyear" min="1" max="4" class="p-2 border rounded" />
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

                selections-label="classrooms"

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
                <option value="registered">Registered</option>
                <option value="unregistered">Unregistered</option>
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
