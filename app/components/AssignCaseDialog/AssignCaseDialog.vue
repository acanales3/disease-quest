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
import { Label } from "@/components/ui/label"
import { Icon } from "#components"
import type { Case } from "~/assets/interface/Case"
import type { Classroom } from "~/assets/interface/Classroom"
import { ref } from "vue"
import DataComboBox from "~/components/DataComboBox/DataComboBox.vue"

const props = defineProps<{
  cases: Case[]
  classrooms: Classroom[]
}>()

// dialog state
const isOpen = ref(false)

// store selected objects (NOT numbers)
const selectedCase = ref<Case | null>(null)
const selectedClassroom = ref<Classroom | null>(null)

// UI state
const status = ref<"idle" | "loading" | "success" | "error">("idle")
const errorMessage = ref("")

// reset form
const resetForm = () => {
  selectedCase.value = null
  selectedClassroom.value = null
  status.value = "idle"
  errorMessage.value = ""
}

// handle dialog open/close
const onOpenChange = (open: boolean) => {
  isOpen.value = open
  if (!open) resetForm()
}

// assign case → classroom
const assignCase = async () => {
  if (!selectedCase.value?.id || !selectedClassroom.value?.id) return

  status.value = "loading"

  try {
    await $fetch("/api/classrooms/assign", {
      method: "POST",
      body: {
        caseId: selectedCase.value.id,
        classroomId: selectedClassroom.value.id,
      },
    })

    status.value = "success"

    // refresh data across page
    await refreshNuxtData()


  } catch (err: any) {
    console.error("Failed to assign case:", err)
    errorMessage.value = err?.data?.message || "Something went wrong"
    status.value = "error"
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <Button
        variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="lucide:arrow-right-circle" size="24" class="text-black" />
          <span class="text-sm">Assign Case to Classroom</span>
        </div>
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px] h-112">
      <DialogHeader>
        <DialogTitle>Assign Case to Classroom</DialogTitle>
        <DialogDescription>
          Select the case and classroom from the dropdowns below.
        </DialogDescription>
      </DialogHeader>

      <!-- FORM -->
      <div v-if="status === 'idle'" class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Case</Label>
          <div class="col-span-3">
            <DataComboBox
              label="Case"
              :data="props.cases"
              v-model="selectedCase"
            />
          </div>
        </div>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label class="text-right">Classroom</Label>
          <div class="col-span-3">
            <DataComboBox
              label="Classroom"
              :data="props.classrooms"
              v-model="selectedClassroom"
            />
          </div>
        </div>
      </div>

      <!-- LOADING -->
      <div
        v-if="status === 'loading'"
        class="flex flex-col items-center py-12 gap-4"
      >
        <Icon name="lucide:loader-2" class="animate-spin" size="40" />
        <p class="text-sm text-gray-500">Assigning case to classroom...</p>
      </div>

      <!-- SUCCESS -->
      <div
        v-if="status === 'success'"
        class="flex flex-col items-center py-12 gap-4"
      >
        <Icon name="lucide:check-circle" class="text-green-500" size="40" />
        <p class="font-medium">Case successfully assigned!</p>
      </div>

      <!-- ERROR -->
      <div
        v-if="status === 'error'"
        class="flex flex-col items-center py-12 gap-4"
      >
        <Icon name="lucide:x-circle" class="text-red-500" size="40" />
        <p class="font-medium">Failed to assign case</p>
        <p class="text-sm text-gray-500">{{ errorMessage }}</p>

        <Button @click="status = 'idle'" variant="outline">
          Try Again
        </Button>
      </div>

      <!-- FOOTER BUTTON -->
      <DialogFooter v-if="status === 'idle'">
        <Button
          type="button"
          :disabled="!selectedCase?.id || !selectedClassroom?.id"
          @click="assignCase"
        >
          Assign Case
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>