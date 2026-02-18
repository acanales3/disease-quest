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
import type { Administrator } from "@/components/AdminDatatable/columns";

const props = defineProps<{ show: boolean; data: Administrator | null }>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", admin: Administrator): void;
}>();

const form = ref({
  userId: "",
  first_name: "",
  last_name: "",
});

const errors = ref({
  first_name: "",
  last_name: "",
});

// Populate form when modal opens / data changes
watch(
  () => props.data,
  (newData) => {
    if (!newData) {
      form.value = {
        userId: "",
        first_name: "",
        last_name: "",
      };
      return;
    }

    const nameParts = (newData.name ?? "").trim().split(/\s+/);

    form.value = {
      userId: newData.userId, // UUID for backend ops later
      first_name: nameParts[0] ?? "",
      last_name: nameParts.slice(1).join(" ") ?? "",
    };
  },
  { immediate: true }
);

// Validate form fields
watch(
  form,
  (val) => {
    if (!val.first_name) errors.value.first_name = "First name is required";
    else if (val.first_name.length > 50)
      errors.value.first_name = "First name cannot exceed 50 characters";
    else errors.value.first_name = "";

    if (!val.last_name) errors.value.last_name = "Last name is required";
    else if (val.last_name.length > 50)
      errors.value.last_name = "Last name cannot exceed 50 characters";
    else errors.value.last_name = "";
  },
  { deep: true, immediate: true }
);

const isInvalid = computed(() =>
  Object.values(errors.value).some((e) => e !== "")
);

// Close handler (dialog open toggle)
const handleOpenChange = (value: boolean) => {
  if (!value) emit("close");
};

const handleSave = async () => {
  if (isInvalid.value) return;

  emit("save", {
    id: props.data?.id ?? 0, // keep row number for table stability
    userId: form.value.userId,
    name: `${form.value.first_name} ${form.value.last_name}`.trim(),
    email: props.data?.email ?? "",
    school: props.data?.school ?? "",
  });

  emit("close");
};
</script>

<template>
  <Dialog :open="props.show" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto my-6">
      <DialogHeader>
        <DialogTitle>Edit {{ form.first_name }} {{ form.last_name }}</DialogTitle>
        <DialogDescription>
          Make changes to the administrator's profile here.
          <br />
          Click 'save changes' when you're done.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3">
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
      </div>

      <DialogFooter>
        <button
          class="p-2 bg-gray-400 transition-colors duration-500 hover:bg-gray-500 rounded text-white"
          @click="emit('close')"
        >
          Close
        </button>

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
