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
const rubricFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const rubricFileInput = ref<HTMLInputElement | null>(null);
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
  rubricFile.value = null;
  errorMessage.value = "";
  successMessage.value = "";
  statusMessage.value = "";
  if (fileInput.value) {
    fileInput.value.value = "";
  }
  if (rubricFileInput.value) {
    rubricFileInput.value.value = "";
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

  const caseFiles = Array.from(target.files).filter(
    (f) =>
      f.type === "application/pdf" ||
      f.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      f.name.toLowerCase().endsWith(".pdf") ||
      f.name.toLowerCase().endsWith(".docx")
  );

  if (caseFiles.length === 0) {
    errorMessage.value = "Please select a PDF or DOCX file.";
    return;
  }

  files.value = [caseFiles[0]];
  errorMessage.value = "";
}

function triggerFileInput() {
  fileInput.value?.click();
}

function handleRubricFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;

  const selected = target.files[0];
  const lowerName = selected.name.toLowerCase();
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/json",
  ];
  const allowedExtensions = [".pdf", ".docx", ".txt", ".md", ".json"];

  const isAllowed =
    allowedTypes.includes(selected.type) ||
    allowedExtensions.some((ext) => lowerName.endsWith(ext));

  if (!isAllowed) {
    errorMessage.value = "Rubric file must be a PDF, DOCX, TXT, MD, or JSON file.";
    return;
  }

  rubricFile.value = selected;
  errorMessage.value = "";
}

function triggerRubricFileInput() {
  rubricFileInput.value?.click();
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
    errorMessage.value = "Please upload a PDF or DOCX file.";
    return;
  }

  // Build FormData
  const formData = new FormData();
  formData.append("file", files.value[0]);
  formData.append("caseName", caseName.value.trim());
  formData.append("caseDescription", caseDescription.value.trim());
  if (rubricFile.value) {
    formData.append("rubricFile", rubricFile.value);
  }

  isLoading.value = true;
  statusMessage.value = "Uploading file and extracting content...";

  try {
    // Start a timer to cycle status messages for UX
    const statusInterval = setInterval(() => {
      const messages = [
        "Extracting text from PDF...",
        "Extracting text from document...",
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
      <Button class="bg-[#4d1979] hover:bg-[#3f1564] text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 h-9">
        <Icon name="lucide:plus" size="15" />
        <span>Create Case</span>
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[480px]" :class="{ 'pointer-events-none': isLoading }">
      <DialogHeader>
        <DialogTitle>Create Case</DialogTitle>
        <DialogDescription>
          Upload a clinical case PDF or DOCX and provide details. AI will generate the full simulation case.
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
          <Label class="text-right">Case File</Label>
          <div class="col-span-3 flex flex-col items-stretch space-y-2">
            <button
              type="button"
              class="w-full px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              :disabled="isLoading"
              @click="triggerFileInput"
            >
              {{ files.length > 0 ? 'Change File' : 'Upload PDF or DOCX' }}
            </button>
            <input
              ref="fileInput"
              id="file-input"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              class="hidden"
              @change="handleFileChange"
            />
            <div v-if="files.length > 0" class="text-sm text-muted-foreground truncate">
              {{ files[0].name }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Rubric</Label>
          <div class="col-span-3 flex flex-col items-stretch space-y-2">
            <button
              type="button"
              class="w-full px-3 py-2 border border-input bg-background rounded hover:bg-accent transition-colors disabled:opacity-50"
              :disabled="isLoading"
              @click="triggerRubricFileInput"
            >
              {{ rubricFile ? 'Change Rubric File' : 'Upload Rubric File (Optional)' }}
            </button>
            <input
              ref="rubricFileInput"
              id="rubric-file-input"
              type="file"
              accept=".pdf,.docx,.txt,.md,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/json"
              class="hidden"
              @change="handleRubricFileChange"
            />
            <div class="text-xs text-muted-foreground leading-relaxed">
              Optional. Upload a rubric document if this case should keep the same core evaluation areas but use different point distributions, anchors, or grading guidance.
            </div>
            <div v-if="rubricFile" class="text-sm text-muted-foreground truncate">
              {{ rubricFile.name }}
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
            This may take 3-4 minutes. Please don't close this dialog.
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
