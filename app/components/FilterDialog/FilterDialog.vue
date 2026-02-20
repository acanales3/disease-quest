<script setup lang="ts">
import { ref, computed } from "vue";
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
import type { Classroom } from "../ClassroomDatatable/columns";

const emit = defineEmits<{
  (e: "apply-filters", filters: FilterCriteria): void;
}>();

const props = defineProps<{
  classrooms?: Classroom[];
  showMsyear?: boolean;
  showClassroom?: boolean;
  showStatus?: boolean;
  role?: "student" | "instructor"; // NEW: identify type
}>();

const showMsyear = props.showMsyear ?? true;
const showClassroom = props.showClassroom ?? true;
const showStatus = props.showStatus ?? true;

interface FilterCriteria {
  name: string;
  email: string;
  school: string;
  msyear?: string[];
  classroom: string[];
  status: string[];
}

const isOpen = ref(false);
const msyearOptions = ["1", "2", "3", "4"];

// Status options depend on role
const statusOptions = computed(() => {
  if (props.role === "instructor") return ["active", "deactivated"];
  return ["registered", "unregistered"];
});

// Temporary filters (UI state)
const tempFilters = ref({
  firstName: "",
  lastName: "",
  email: "",
  school: "",
  msyear: [] as string[],
  classroom: [] as string[],
  status: [] as string[],
});

// Saved filters (persisted state)
const savedFilters = ref({
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  school: "",
  msyear: [] as string[],
  classroom: [] as string[],
  status: [] as string[],
});

const toggleMsyear = (year: string) => {
  const index = tempFilters.value.msyear.indexOf(year);
  index === -1 ? tempFilters.value.msyear.push(year) : tempFilters.value.msyear.splice(index, 1);
};

const toggleClassroom = (classroom: string) => {
  const index = tempFilters.value.classroom.indexOf(classroom);
  index === -1 ? tempFilters.value.classroom.push(classroom) : tempFilters.value.classroom.splice(index, 1);
};

const toggleStatus = (status: string) => {
  const index = tempFilters.value.status.indexOf(status);
  index === -1 ? tempFilters.value.status.push(status) : tempFilters.value.status.splice(index, 1);
};

const resetFilters = () => {
  tempFilters.value = { firstName: "", lastName: "", email: "", school: "", msyear: [], classroom: [], status: [] };
};

const saveFilters = () => {
  const combinedName = `${tempFilters.value.firstName} ${tempFilters.value.lastName}`.trim();

  savedFilters.value = {
    firstName: tempFilters.value.firstName,
    lastName: tempFilters.value.lastName,
    name: combinedName,
    email: tempFilters.value.email,
    school: tempFilters.value.school,
    msyear: [...tempFilters.value.msyear],
    classroom: [...tempFilters.value.classroom],
    status: [...tempFilters.value.status],
  };

  const filterCriteria: FilterCriteria = {
    name: combinedName,
    email: savedFilters.value.email,
    school: savedFilters.value.school,
    classroom: [...savedFilters.value.classroom],
    status: [...savedFilters.value.status],
    ...(showMsyear && { msyear: [...savedFilters.value.msyear] }),
  };

  emit("apply-filters", filterCriteria);
  isOpen.value = false;
};

const cancelFilters = () => {
  tempFilters.value = {
    firstName: savedFilters.value.firstName,
    lastName: savedFilters.value.lastName,
    email: savedFilters.value.email,
    school: savedFilters.value.school,
    msyear: [...savedFilters.value.msyear],
    classroom: [...savedFilters.value.classroom],
    status: [...savedFilters.value.status],
  };
  isOpen.value = false;
};

const onOpenChange = (open: boolean) => {
  if (open) {
    tempFilters.value = {
      firstName: savedFilters.value.firstName,
      lastName: savedFilters.value.lastName,
      email: savedFilters.value.email,
      school: savedFilters.value.school,
      msyear: [...savedFilters.value.msyear],
      classroom: [...savedFilters.value.classroom],
      status: [...savedFilters.value.status],
    };
  }
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
        <DialogTitle>Filters</DialogTitle>
        <DialogDescription>Add search criteria to filter results. All fields are optional.</DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
        <!-- LEFT COLUMN -->
        <div class="flex flex-col gap-5">
          <div class="flex flex-col gap-1.5">
            <Label>First Name</Label>
            <Input v-model="tempFilters.firstName" placeholder="Enter first name" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Last Name</Label>
            <Input v-model="tempFilters.lastName" placeholder="Enter last name" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input v-model="tempFilters.email" placeholder="Enter email" />
          </div>

          <div v-if="showStatus" class="flex flex-col gap-1.5">
            <Label>Status</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
              <div
                v-for="statusOption in statusOptions"
                :key="statusOption"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="tempFilters.status.includes(statusOption)"
                  @change="toggleStatus(statusOption)"
                  class="w-4 h-4 cursor-pointer"
                />
                <label class="capitalize text-sm cursor-pointer">
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

          <div v-if="showMsyear" class="flex flex-col gap-1.5">
            <Label>MS Year</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
              <div
                v-for="year in msyearOptions"
                :key="year"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="tempFilters.msyear.includes(year)"
                  @change="toggleMsyear(year)"
                  class="w-4 h-4 cursor-pointer"
                />
                <label class="text-sm cursor-pointer">Year {{ year }}</label>
              </div>

              <div v-if="tempFilters.msyear.length === 0" class="text-xs text-gray-400">
                No years selected
              </div>
            </div>
          </div>

          <div v-if="showClassroom" class="flex flex-col gap-1.5">
            <Label>Classroom</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 bg-gray-50">
              <div
                v-for="classroom in props.classrooms"
                :key="classroom.id"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :checked="tempFilters.classroom.includes(String(classroom.id))"
                  @change="toggleClassroom(String(classroom.id))"
                  class="w-4 h-4 cursor-pointer"
                />
                <label class="text-sm cursor-pointer">{{ classroom.name }}</label>
              </div>

              <div v-if="tempFilters.classroom.length === 0" class="text-xs text-gray-400">
                No classrooms selected
              </div>
            </div>
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
