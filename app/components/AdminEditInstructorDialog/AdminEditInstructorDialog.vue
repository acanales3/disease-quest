<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ref, watch, computed } from "vue";
import type { Instructor } from "@/assets/interface/Instructor";

const props = defineProps<{
  show: boolean;
  data: Instructor | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", instructor: Instructor): void;
}>();

const form = ref<{
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school: string;
  classroom: number | null;
  status: "active" | "deactivated";
}>({
  id: "",
  email: "",
  first_name: "",
  last_name: "",
  school: "",
  classroom: null,
  status: "active",
});

const errors = ref({
  first_name: "",
  last_name: "",
  school: "",
  email: "",
});

watch(
  () => props.data,
  (newData) => {
    if (!newData) return;

    const nameParts = newData.name.trim().split(/\s+/);

    form.value = {
      id: newData.id,
      email: newData.email,
      first_name: nameParts[0] ?? "",
      last_name: nameParts.slice(1).join(" "),
      school: newData.school,
      classroom: newData.classroom,
      status: newData.status,
    };
  },
  { immediate: true },
);

watch(
  form,
  (val) => {
    errors.value.first_name = !val.first_name
      ? "First name is required"
      : val.first_name.length > 50
        ? "First name cannot exceed 50 characters"
        : "";

    errors.value.last_name = !val.last_name
      ? "Last name is required"
      : val.last_name.length > 50
        ? "Last name cannot exceed 50 characters"
        : "";

    errors.value.school = !val.school
      ? "School is required"
      : val.school.length > 255
        ? "School name cannot exceed 255 characters"
        : "";

    errors.value.email = !val.email
      ? "Email is required"
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.email)
        ? "Invalid email format"
        : "";
  },
  { deep: true, immediate: true },
);

const isInvalid = computed(() =>
  Object.values(errors.value).some((err) => err !== ""),
);

const handleOpenChange = (value: boolean) => {
  if (!value) emit("close");
};

const handleSave = () => {
  if (isInvalid.value) return;

  emit("save", {
    id: form.value.id,
    email: form.value.email,
    name: `${form.value.first_name} ${form.value.last_name}`.trim(),
    school: form.value.school,
    classroom: form.value.classroom ?? 0,
    status: form.value.status,
  });

  emit("close");
};
</script>

<template>
  <Dialog :open="show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>
          Edit {{ form.first_name }} {{ form.last_name }}
        </DialogTitle>
        <DialogDescription>
          Make changes to the instructor's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3">
        <label class="flex flex-col">
          Email
          <input
            type="email"
            v-model="form.email"
            class="p-2 border rounded"
            :class="{ 'border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-red-500 text-xs mt-1">
            {{ errors.email }}
          </p>
        </label>

        <label class="flex flex-col">
          First Name
          <input
            type="text"
            v-model="form.first_name"
            class="p-2 border rounded"
            :class="{ 'border-red-500': errors.first_name }"
          />
          <p v-if="errors.first_name" class="text-red-500 text-xs mt-1">
            {{ errors.first_name }}
          </p>
        </label>

        <label class="flex flex-col">
          Last Name
          <input
            type="text"
            v-model="form.last_name"
            class="p-2 border rounded"
            :class="{ 'border-red-500': errors.last_name }"
          />
          <p v-if="errors.last_name" class="text-red-500 text-xs mt-1">
            {{ errors.last_name }}
          </p>
        </label>

        <label class="flex flex-col">
          School
          <input
            type="text"
            v-model="form.school"
            class="p-2 border rounded"
            :class="{ 'border-red-500': errors.school }"
          />
          <p v-if="errors.school" class="text-red-500 text-xs mt-1">
            {{ errors.school }}
          </p>
        </label>

        <label class="flex flex-col">
          Classroom
          <input
            type="number"
            v-model.number="form.classroom"
            min="0"
            class="p-2 border rounded"
          />
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
        <button
          class="p-2 bg-gray-400 hover:bg-gray-500 rounded text-white"
          @click="emit('close')"
        >
          Close
        </button>

        <button
          class="p-2 bg-[#AF67F0] hover:bg-purple-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isInvalid"
          @click="handleSave"
        >
          Save Changes
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
