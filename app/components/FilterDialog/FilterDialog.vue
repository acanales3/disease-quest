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
  (e: "apply-filters", filters: FilterCriteria): void;
}>();

interface FilterCriteria {
  name: string;
  email: string;
  school: string;
  msyear: string[];
  classroom: string[];
  status: string[];
}

interface NameFields {
  firstName: string;
  lastName: string;
}

const isOpen = ref(false);

const msyearOptions = ["1", "2", "3", "4"];
const classroomOptions = ["0", "1", "2"];
const statusOptions = ["registered", "unregistered"];

const tempFilters = ref<FilterCriteria & NameFields>({
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  school: "",
  msyear: [],
  classroom: [],
  status: [],
});

const savedFilters = ref<FilterCriteria & NameFields>({
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  school: "",
  msyear: [],
  classroom: [],
  status: [],
});

const toggleArrayValue = (arr: string[], value: string) => {
  const index = arr.indexOf(value);
  index === -1 ? arr.push(value) : arr.splice(index, 1);
};

const resetFilters = () => {
  tempFilters.value = {
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    school: "",
    msyear: [],
    classroom: [],
    status: [],
  };
};

const saveFilters = () => {
  const combinedName =
    `${tempFilters.value.firstName} ${tempFilters.value.lastName}`.trim();

  savedFilters.value = {
    ...tempFilters.value,
    name: combinedName,
    msyear: [...tempFilters.value.msyear],
    classroom: [...tempFilters.value.classroom],
    status: [...tempFilters.value.status],
  };

  emit("apply-filters", savedFilters.value);
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
        <DialogTitle>Filter Students</DialogTitle>
        <DialogDescription>
          Add search criteria to filter the student list. All fields are
          optional.
        </DialogDescription>
      </DialogHeader>

      <!-- TWO COLUMN LAYOUT -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        <!-- LEFT COLUMN -->
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <Label for="firstName" class="mb-1">First Name</Label>
            <Input
              id="firstName"
              v-model="tempFilters.firstName"
              placeholder="Enter first name"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="lastName" class="mb-1">Last Name</Label>
            <Input
              id="lastName"
              v-model="tempFilters.lastName"
              placeholder="Enter last name"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label for="email" class="mb-1">Email</Label>
            <Input
              id="email"
              v-model="tempFilters.email"
              placeholder="Enter email"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label class="mb-1">Status</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
              <div
                v-for="statusOption in statusOptions"
                :key="statusOption"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="tempFilters.status.includes(statusOption)"
                  @change="toggleArrayValue(tempFilters.status, statusOption)"
                  class="w-4 h-4 cursor-pointer"
                />
                <span class="text-sm capitalize">{{ statusOption }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <Label for="school" class="mb-1">School</Label>
            <Input
              id="school"
              v-model="tempFilters.school"
              placeholder="Enter school"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label class="mb-1">MS Year</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
              <div
                v-for="year in msyearOptions"
                :key="year"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="tempFilters.msyear.includes(year)"
                  @change="toggleArrayValue(tempFilters.msyear, year)"
                  class="w-4 h-4 cursor-pointer"
                />
                <span class="text-sm">Year {{ year }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <Label class="mb-1">Classroom</Label>
            <div
              class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto"
            >
              <div
                v-for="classroom in classroomOptions"
                :key="classroom"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="tempFilters.classroom.includes(classroom)"
                  @change="toggleArrayValue(tempFilters.classroom, classroom)"
                  class="w-4 h-4 cursor-pointer"
                />
                <span class="text-sm">Example Classroom {{ classroom }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <DialogFooter class="w-full flex items-center">
        <Button
          variant="outline"
          @click="resetFilters"
          class="flex items-center gap-2"
        >
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
