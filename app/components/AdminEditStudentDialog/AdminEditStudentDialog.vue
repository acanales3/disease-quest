<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Classroom, ClassroomOptions } from '@/assets/interface/Classroom'

import MultiSelect from '@/components/ui/MultiSelect.vue'
import type { Student } from '~/assets/interface/Student';

const props = defineProps<{ show: boolean; data: Student; classrooms: ClassroomOptions[] }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', student: Student): void;
}>();

// reactive form data
const form = ref<{
  id: string,
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
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  school: '',
  msyear: 1,
  classrooms: [],
  status: 'registered',
});

const errors = ref({
  first_name: '',
  last_name: '',
  nickname: '',
  email: '',
  school: '',
});

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

// When modal opens, populate with data.
watch(
  () => props.data, 
  (newData) => {
    if (!newData) return
    const nameParts = newData.name.trim().split(/\s+/);
    form.value = {
      id: newData.id,
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' ') ?? '',
      nickname: newData.nickname,
      email: newData.email,
      school: newData.school,
      msyear: newData.msyear,
      classrooms: (newData.classrooms ?? [])
        .map((id: number) => {
          const match = props.classrooms.find(c => c.id === id)
          return match ? { id: match.id, name: match.name } : null
        })
        .filter(Boolean) as ClassroomOptions[],
      status: newData.status,
    }
  }, { immediate: true },
);

const isInvalid = computed(() => {
  return Object.values(errors.value).some((err) => err !== '');
});


// handle dialog close
const handleOpenChange = (value: boolean) => {
  if (!value) emit('close');
};

// handle save
const handleSave = () => {
  emit('save', { 
    id: form.value.id,
    name: `${form.value.first_name} ${form.value.last_name}`.trim(),
    nickname: form.value.nickname,
    email: form.value.email,
    school: form.value.school,
    msyear: form.value.msyear,
    classrooms: form.value.classrooms ?? [],
    status: form.value.status,
   });
  emit('close');
};
</script>

<template>
  <Dialog :open="props.show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>Edit {{ form.first_name }} {{ form.last_name }}</DialogTitle>
        <DialogDescription>
          Make changes to the student's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <!-- Input Form -->
      <div class="flex flex-col gap-3">
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

      <DialogFooter>
        <button class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white" @click="emit('close')">Close</button>

        <button
          class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isInvalid"
          @click="handleSave"
        >
          Save Changes
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
