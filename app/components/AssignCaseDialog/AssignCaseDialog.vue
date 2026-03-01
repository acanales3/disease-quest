<script setup lang="ts">
import { ref, computed } from "vue"
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
import MultiSelect from "~/components/ui/MultiSelect.vue"

import type { Case } from "~/assets/interface/Case"
import type { Classroom } from "~/assets/interface/Classroom"

const props = defineProps<{
  cases: Case[]
  classrooms: Classroom[]
}>()

const isOpen = ref(false)

const selectedCases = ref<Case[]>([])
const selectedClassroom = ref<Classroom | null>(null)

const status = ref<"idle" | "loading" | "success" | "error">("idle")
const errorMessage = ref("")

const resetForm = () => {
  selectedCases.value = []
  selectedClassroom.value = null
  status.value = "idle"
  errorMessage.value = ""
}

const onOpenChange = (open: boolean) => {
  isOpen.value = open
  if (!open) resetForm()
}

const assignCases = async () => {
  if (!selectedClassroom.value || selectedCases.value.length === 0) return

  status.value = "loading"

  try {
    await $fetch("/api/classrooms/assign", {
      method: "POST",
      body: {
        classroomId: selectedClassroom.value.id,
        caseIds: selectedCases.value.map(c => c.id),
      },
    })

    status.value = "success"
    await refreshNuxtData()
  } catch (err: any) {
    console.error("Failed to assign cases:", err)
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
        class="h-9 px-4 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <Icon name="lucide:send" size="14" />
        <span class="text-sm">Assign Case</span>
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Assign Case to Classroom</DialogTitle>
        <DialogDescription>
          Select one classroom and one or more cases from the dropdowns below.
        </DialogDescription>
      </DialogHeader>

      <!-- FORM -->
      <div v-if="status === 'idle'" class="grid gap-6 py-4">

        <!-- CASES (MULTI SELECT) -->
        <div class="grid grid-cols-4 items-start gap-4">
          <Label class="text-right pt-2">Cases</Label>
          <div class="col-span-3 flex flex-col gap-2">
            <MultiSelect
              :items="props.cases.map(c => ({ value: c.id, label: c.name }))"
              :selected="selectedCases.map(c => ({ value: c.id, label: c.name }))"
              selections-label="cases"
              searchable
              @update:selected="val => {
                selectedCases = val
                  .map(v => props.cases.find(c => c.id === v.value))
                  .filter(Boolean)
              }"
            />
            <!-- Selected cases pills -->
            <div v-if="selectedCases.length > 0" class="flex flex-wrap gap-1.5">
              <span
                v-for="c in selectedCases"
                :key="c.id"
                class="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1"
              >
                {{ c.name }}
                <button
                  type="button"
                  class="hover:text-blue-600"
                  @click="selectedCases = selectedCases.filter(sc => sc.id !== c.id)"
                >
                  <Icon name="lucide:x" size="12" />
                </button>
              </span>
            </div>
            <p v-else class="text-xs text-gray-400 italic">No cases selected</p>
          </div>
        </div>

        <!-- CLASSROOM (SINGLE SELECT via MultiSelect, max 1) -->
        <div class="grid grid-cols-4 items-start gap-4">
          <Label class="text-right pt-2">Classroom</Label>
          <div class="col-span-3 flex flex-col gap-2">
            <MultiSelect
              :items="props.classrooms.map(c => ({ value: c.id, label: c.name }))"
              :selected="selectedClassroom ? [{ value: selectedClassroom.id, label: selectedClassroom.name }] : []"
              selections-label="classroom"
              searchable
              :max="1"
              @update:selected="val => {
                const last = val[val.length - 1]
                selectedClassroom = last
                  ? (props.classrooms.find(c => c.id === last.value) ?? null)
                  : null
              }"
            />
            <!-- Selected classroom chip -->
            <div v-if="selectedClassroom" class="flex items-center gap-1.5">
              <span class="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1">
                <Icon name="lucide:layout-grid" size="12" />
                {{ selectedClassroom.name }}
                <button
                  type="button"
                  class="hover:text-green-600"
                  @click="selectedClassroom = null"
                >
                  <Icon name="lucide:x" size="12" />
                </button>
              </span>
            </div>
            <p v-else class="text-xs text-gray-400 italic">No classroom selected</p>
          </div>
        </div>

        <!-- SUMMARY BANNER -->
        <div
          v-if="selectedCases.length > 0 && selectedClassroom"
          class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          Assigning <strong>{{ selectedCases.length }} case{{ selectedCases.length > 1 ? 's' : '' }}</strong>
          to <strong>{{ selectedClassroom.name }}</strong>.
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="status === 'loading'" class="flex flex-col items-center py-12 gap-4">
        <Icon name="lucide:loader-2" class="animate-spin" size="40" />
        <p class="text-sm text-gray-500">Assigning cases to classroom...</p>
      </div>

      <!-- SUCCESS -->
      <div v-if="status === 'success'" class="flex flex-col items-center py-12 gap-4">
        <Icon name="lucide:check-circle" class="text-green-500" size="40" />
        <p class="font-medium">Cases successfully assigned!</p>
      </div>

      <!-- ERROR -->
      <div v-if="status === 'error'" class="flex flex-col items-center py-12 gap-4">
        <Icon name="lucide:x-circle" class="text-red-500" size="40" />
        <p class="font-medium">Failed to assign cases</p>
        <p class="text-sm text-gray-500">{{ errorMessage }}</p>
        <Button @click="status = 'idle'" variant="outline">Try Again</Button>
      </div>

      <!-- FOOTER -->
      <DialogFooter v-if="status === 'idle'">
        <Button
          type="button"
          :disabled="!selectedClassroom || selectedCases.length === 0"
          @click="assignCases"
        >
          Assign Case(s)
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>