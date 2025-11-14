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
  email: '',
  school: '',
  msyear: 1,
  classroom: 0,
  status: 'registered',
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
    <DialogContent>
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
          <input type="text" v-model="form.name" class="p-2 border rounded" />
        </label>

        <label class="flex flex-col">
          Email
          <input type="email" v-model="form.email" class="p-2 border rounded" />
        </label>

        <label class="flex flex-col">
          School
          <input type="text" v-model="form.school" class="p-2 border rounded" />
        </label>

        <label class="flex flex-col">
          MS Year
          <input type="number" v-model.number="form.msyear" min="1" class="p-2 border rounded" />
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
        <button class="p-2 bg-gray-200 transition-colors duration-500 hover:bg-gray-300 rounded" @click="emit('close')">Close</button>

        <button class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-500 rounded" @click="handleSave">Save Changes</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
