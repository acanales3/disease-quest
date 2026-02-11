<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ref, watch, computed } from 'vue';

interface InstructorEditForm {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  school: string;
  classroom: number | null;
  status: 'active' | 'deactivated';
}

const props = defineProps<{ show: boolean; data: InstructorEditForm | null }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', instructor: InstructorEditForm): void;
}>();

// reactive form data
const form = ref<InstructorEditForm>({
  id: '',
  first_name: '',
  last_name: '',
  email: '',
  school: '',
  classroom: null,
  status: 'active',
});

const errors = ref({
  first_name: '',
  last_name: '',
  email: '',
  school: '',
});

// when modal opens, populate form inputs with props.data
watch(
  () => props.data,
  (newData) => {
    if (!newData) return
    form.value = { ...newData };
  },
  { immediate: true },
);

// Validate form fields
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



// handle dialog close
const handleOpenChange = (value: boolean) => {
  if (!value) emit('close');
};

// handle save
const handleSave = async () => {
  if (isInvalid.value) return;

  const updated = { ...form.value }
  emit('save', updated);
  emit('close');
};
</script>

<template>
  <Dialog :open="props.show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>Edit {{ form.first_name }} {{ form.last_name }}</DialogTitle>
        <DialogDescription>
          Make changes to the instructor's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <!-- Input Form -->
      <div class="flex flex-col gap-3">
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
        <button class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white" @click="emit('close')">Close</button>

        <button
          class="p-2 bg-[#AF67F0] transition-colors duration-500 hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSave"
          :disabled="isInvalid"
        >
          Save Changes
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
