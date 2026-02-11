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

// Props — parent can pass a refresh callback
const props = defineProps<{
  onCaseCreated?: () => void;
}>();

// ── Form state ─────────────────────────────────────────────────────
const caseName = ref("");
const caseDescription = ref("");
const files = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);

// ── Pipeline state ─────────────────────────────────────────────────
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const statusMessage = ref("");

// Reset everything when dialog closes
function resetForm() {
  caseName.value = "";
  caseDescription.value = "";
  files.value = [];
  errorMessage.value = "";
  successMessage.value = "";
  statusMessage.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

const onOpenChange = (open: boolean) => {
  // Don't allow closing while loading
  if (!open && isLoading.value) return;

  isOpen.value = open;
  if (!open) {
    resetForm();
  }
};

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;

  // Only accept first PDF file
  const pdfFiles = Array.from(target.files).filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );

  if (pdfFiles.length === 0) {
    errorMessage.value = "Please select a PDF file.";
    return;
  }

  files.value = [pdfFiles[0]]; // Only one PDF at a time
  errorMessage.value = "";
}

function triggerFileInput() {
  fileInput.value?.click();
}

// ── Submit handler ─────────────────────────────────────────────────
async function handleSubmit() {
  // Clear previous messages
  errorMessage.value = "";
  successMessage.value = "";

  // Validation
  if (!caseName.value.trim()) {
    errorMessage.value = "Case name is required.";
    return;
  }
  if (!caseDescription.value.trim()) {
    errorMessage.value = "Case description is required.";
    return;
  }
  if (files.value.length === 0) {
    errorMessage.value = "Please upload a PDF file.";
    return;
  }

  // Build FormData
  const formData = new FormData();
  formData.append("file", files.value[0]);
  formData.append("caseName", caseName.value.trim());
  formData.append("caseDescription", caseDescription.value.trim());

  isLoading.value = true;
  statusMessage.value = "Uploading PDF and extracting content...";

  try {
    // Start a timer to cycle status messages for UX
    const statusInterval = setInterval(() => {
      const messages = [
        "Extracting text from PDF...",
        "AI is analyzing the clinical case...",
        "Generating case content with OpenAI...",
        "Building disclosures, test results, and scoring...",
        "Validating generated case structure...",
        "Almost there — finalizing case data...",
      ];
      const elapsed = Date.now() - startTime;
      const idx = Math.min(
        Math.floor(elapsed / 10000),
        messages.length - 1
      );
      statusMessage.value = messages[idx];
    }, 10000);

    const startTime = Date.now();

    const response = await $fetch<{
      success: boolean;
      caseId: number;
      message: string;
      aiAttempts: number;
    }>("/api/cases/create", {
      method: "POST",
      body: formData,
    });

    clearInterval(statusInterval);

    if (response.success) {
      successMessage.value = response.message;
      statusMessage.value = "";

      // Refresh the parent's case list after a short delay
      setTimeout(() => {
        props.onCaseCreated?.();
        isOpen.value = false;
        resetForm();
      }, 1500);
    } else {
      errorMessage.value = "Unexpected response from server.";
      statusMessage.value = "";
    }
  } catch (err: any) {
    statusMessage.value = "";
    // Extract meaningful error from Nuxt/H3 error shape
    const msg =
      err?.data?.message ||
      err?.statusMessage ||
      err?.message ||
      "An unexpected error occurred.";
    errorMessage.value = msg;
  } finally {
    isLoading.value = false;
  }
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
    <DialogContent class="sm:max-w-[480px]" :class="{ 'pointer-events-none': isLoading }">
      <DialogHeader>
        <DialogTitle>Create Case</DialogTitle>
        <DialogDescription>
          Upload a clinical case PDF and provide details. AI will generate the full simulation case.
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Case Name -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="case-name" class="text-right">
            Case Name
          </Label>
          <Input
            id="case-name"
            v-model="caseName"
            placeholder="e.g. John Doe — Acute Appendicitis"
            class="col-span-3"
            :disabled="isLoading"
          />
        </div>

        <!-- Case Description -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="case-description" class="text-right">
            Description
          </Label>
          <Input
            id="case-description"
            v-model="caseDescription"
            placeholder="Brief case summary..."
            class="col-span-3"
            :disabled="isLoading"
          />
        </div>

        <!-- File Upload -->
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">PDF File</Label>
          <div class="col-span-3 flex flex-col items-stretch space-y-2">
            <button
              type="button"
              class="w-full px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              :disabled="isLoading"
              @click="triggerFileInput"
            >
              {{ files.length > 0 ? 'Change PDF' : 'Upload PDF' }}
            </button>
            <input
              ref="fileInput"
              id="file-input"
              type="file"
              accept=".pdf,application/pdf"
              class="hidden"
              @change="handleFileChange"
            />
            <div v-if="files.length > 0" class="text-sm text-muted-foreground truncate">
              {{ files[0].name }}
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="flex flex-col items-center gap-3 py-4">
          <div class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm text-muted-foreground">{{ statusMessage }}</span>
          </div>
          <p class="text-xs text-muted-foreground text-center">
            This may take 30-60 seconds. Please don't close this dialog.
          </p>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
          {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-300">
          {{ successMessage }}
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          :disabled="isLoading"
          @click="handleSubmit"
        >
          <template v-if="isLoading">
            Processing...
          </template>
          <template v-else>
            Create Case
          </template>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
