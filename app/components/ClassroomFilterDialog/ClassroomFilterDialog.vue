<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "#components";

const emit = defineEmits<{
  (e: "apply-filters", filters: ClassroomFilterCriteria): void;
}>();

interface ClassroomFilterCriteria {
  name: string;
  code: string;
  instructor: string;
  school: string;
  section: string;
  startDate: string; // empty string if not selected
  endDate: string;
  status: string[]; // ["active", "inactive"]
}

const isOpen = ref(false);

const statusOptions = ["active", "inactive"];

const tempFilters = ref<ClassroomFilterCriteria>({
  name: "",
  code: "",
  instructor: "",
  school: "",
  section: "",
  startDate: "",
  endDate: "",
  status: [],
});

const savedFilters = ref<ClassroomFilterCriteria>({ ...tempFilters.value });

const toggleStatus = (status: string) => {
  const index = tempFilters.value.status.indexOf(status);
  if (index === -1) tempFilters.value.status.push(status);
  else tempFilters.value.status.splice(index, 1);
};

const resetFilters = () => {
  tempFilters.value = {
    name: "",
    code: "",
    instructor: "",
    school: "",
    section: "",
    startDate: "",
    endDate: "",
    status: [],
  };
};

const saveFilters = () => {
  savedFilters.value = { ...tempFilters.value };
  emit("apply-filters", { ...savedFilters.value });
  isOpen.value = false;
};

const cancelFilters = () => {
  tempFilters.value = { ...savedFilters.value };
  isOpen.value = false;
};

const onOpenChange = (open: boolean) => {
  if (open) tempFilters.value = { ...savedFilters.value };
  isOpen.value = open;
};
</script>

<template>
  <Dialog :open="isOpen" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <div
        class="flex items-center justify-center w-8 h-8 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
      >
        <Icon name="lets-icons:filter" />
      </div>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Filter Classrooms</DialogTitle>
        <DialogDescription>
          Add search criteria to filter the classroom list. All fields are optional.
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        <!-- LEFT COLUMN -->
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input v-model="tempFilters.name" placeholder="Enter classroom name" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Code</Label>
            <Input v-model="tempFilters.code" placeholder="Enter classroom code" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Instructor</Label>
            <Input v-model="tempFilters.instructor" placeholder="Enter instructor" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Status</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
              <div
                v-for="statusOption in statusOptions"
                :key="statusOption"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :id="`status-${statusOption}`"
                  :checked="tempFilters.status.includes(statusOption)"
                  @change="toggleStatus(statusOption)"
                  class="w-4 h-4 cursor-pointer"
                />
                <label
                  :for="`status-${statusOption}`"
                  class="capitalize text-sm cursor-pointer"
                >
                  {{ statusOption }}
                </label>
              </div>
              <div v-if="tempFilters.status.length === 0" class="text-xs text-gray-400">
                No status selected
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <Label>School</Label>
            <Input v-model="tempFilters.school" placeholder="Enter school" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Section</Label>
            <Input v-model="tempFilters.section" placeholder="Enter section" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Start Date</Label>
            <Input type="date" v-model="tempFilters.startDate" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>End Date</Label>
            <Input type="date" v-model="tempFilters.endDate" />
          </div>
        </div>
      </div>

      <DialogFooter class="w-full flex items-center">
        <Button variant="outline" @click="resetFilters" class="flex items-center gap-2">
          <Icon name="mdi:refresh" size="16" />
          Reset
        </Button>

        <div class="ml-auto flex gap-2">
          <Button variant="outline" @click="cancelFilters">Cancel</Button>
          <Button @click="saveFilters">Apply Filters</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
