<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "#components"

const files = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);

// Reset form when dialog is closed
const onOpenChange = (open: boolean) => {
  isOpen.value = open;
  if (!open) {
    // Reset form when dialog is closed
    files.value = [];
    if (fileInput.value) {
      fileInput.value.value = ''; // Reset file input
    }
  }
};

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  files.value = [...files.value, ...Array.from(target.files)];
  console.log("Selected files:", files.value);
}

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <Button variant="outline" class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4">
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="hugeicons:plus-sign-square" size="24" class="text-purple-500"/>
          <span class="text-sm">Create Case</span>
        </div>
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px] h-[28rem]">
      <DialogHeader>
        <DialogTitle>Create Case</DialogTitle>
        <DialogDescription>
          State the case details and upload files here.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="case-name" class="text-right">
            Case Name
          </Label>
          <Input :id="`case-name`" :default-value="'Case name here'" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="case-description" class="text-right">
            Case Description
          </Label>
          <Input :id="`case-description`" :default-value="'Case description here'" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <div class="col-start-2 col-span-2 flex flex-col items-center space-y-2">
            <button 
              type="button" 
              class="w-full px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              @click="triggerFileInput"
            >
              Upload Files
            </button>
            <input
              ref="fileInput"
              id="file-input"
              type="file"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            <div v-if="files.length > 0" class="text-sm text-gray-500">
              {{ files.length }} file(s) selected
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">
          Create Case
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
