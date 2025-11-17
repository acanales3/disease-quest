<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import type { Instructor } from '~/assets/interface/Instructor';

const props = defineProps<{ show: boolean; data: Instructor }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', instructor: Instructor): void;
}>();

// reactive form data
const form = ref<Instructor>({
  name: '',
  email: '',
  school: '',
  classroom: 0,
  status: 'active',
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
        <DialogTitle>Edit {{ props.data?.name || 'Instructor' }}</DialogTitle>
        <DialogDescription>
          Make changes to the instructor's profile here.
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
          Classroom
          <input type="number" v-model.number="form.classroom" min="0" class="p-2 border rounded" />
        </label>

        <label class="flex flex-col">
          Status
          <select v-model="form.status" class="p-2 border rounded">
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </label>
      </div>

        <DialogFooter>
          <button class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white"
            @click="emit('close')">
            Close
          </button>

          <button class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white"
            @click="handleSave">
            Save Changes
          </button>
        </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
