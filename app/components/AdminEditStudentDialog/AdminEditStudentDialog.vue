<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import type { Student } from '~/assets/interface/Student';

const props = defineProps<{ show: boolean; data: Student }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', student: Student): void;
}>();

// reactive form data
const form = ref<Student>({
  name: '',
  nickname: '',
  email: '',
  school: '',
  msyear: 1,
  classroom: 0,
  status: 'registered',
});

const errors = ref({
  name: '',
  nickname: '',
  email: '',
  school: '',
});

watch(
  form,
  (val) => {
    // name validation
    if (!val.name) {
      errors.value.name = 'Name is required.';
    } else if (val.name.length > 100) {
      errors.value.name = 'Names cannot exceed 100 characters'
    } else {
      errors.value.name = '';
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

const isInvalid = computed(() => {
  return Object.values(errors.value).some((err) => err !== '');
});

// when modal opens, populate form inputs with props.data
watch(
  () => props.data,
  (newData) => {
    if (newData) {
      form.value = { ...newData };
    }
  },
  { immediate: true },
);

// handle dialog close
const handleOpenChange = (value: boolean) => {
  if (!value) emit('close');
};

// handle save
const handleSave = () => {
  emit('save', { ...form.value });
  emit('close');
};
</script>

<template>
  <Dialog :open="props.show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>Edit {{ props.data?.name || 'Student' }}</DialogTitle>
        <DialogDescription>
          Make changes to the student's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <!-- Input Form -->
      <div class="flex flex-col gap-3">
        <label class="flex flex-col">
          Name
          <input type="text" v-model="form.name" class="p-2 border rounded" :class="{ 'border-red-500': errors.name }" />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">
            {{ errors.name }}
          </p>
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

        <label class="flex flex-col">
          Classroom
          <input type="number" v-model.number="form.classroom" min="0" class="p-2 border rounded" />
        </label>

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
