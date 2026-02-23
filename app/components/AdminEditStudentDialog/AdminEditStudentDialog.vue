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
import type { Student } from "@/assets/interface/Student";

const props = defineProps<{
  show: boolean;
  data: Student | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", student: Student): void;
}>();
const form = ref<Student>({
  name: "",
  nickname: "",
  school: "",
  msyear: 1,
  classroom: 0,
  status: "registered",
});
const errors = ref({
  name: "",
  nickname: "",
  school: "",
});

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      form.value = { ...newData };
    }
  },
  { immediate: true },
);

watch(
  form,
  (val) => {
    errors.value.name = !val.name
      ? "Name is required."
      : val.name.length > 100
        ? "Names cannot exceed 100 characters"
        : "";

    errors.value.nickname = !val.nickname
      ? "Nickname is required."
      : val.nickname.length > 30
        ? "Nickname cannot exceed 30 characters"
        : "";

    errors.value.school = !val.school
      ? "School is required."
      : val.school.length > 255
        ? "School name cannot exceed 255 characters"
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

  emit("save", { ...form.value });
  emit("close");
};
</script>

<template>
  <Dialog :open="show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle> Edit {{ form.name || "Student" }} </DialogTitle>
        <DialogDescription>
          Make changes to the student's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3">
        <label class="flex flex-col">
          Name
          <input
            type="text"
            v-model="form.name"
            class="p-2 border rounded"
            :class="{ 'border-red-500': errors.name }"
          />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">
            {{ errors.name }}
          </p>
        </label>

        <label class="flex flex-col">
          Nickname
          <input
            type="text"
            v-model="form.nickname"
            class="p-2 border rounded"
            :class="{ 'border-red-500': errors.nickname }"
          />
          <p v-if="errors.nickname" class="text-red-500 text-xs mt-1">
            {{ errors.nickname }}
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
          MS Year
          <input
            type="number"
            v-model.number="form.msyear"
            min="1"
            max="4"
            class="p-2 border rounded"
          />
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
            <option value="registered">Registered</option>
            <option value="unregistered">Unregistered</option>
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
