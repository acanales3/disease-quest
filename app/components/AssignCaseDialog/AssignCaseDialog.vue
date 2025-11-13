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

const isOpen = ref(false);

// Reset form when dialog is closed
const onOpenChange = (open: boolean) => {
  isOpen.value = open;
};

</script>


<template>
  <Dialog :open="isOpen" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <Button variant="outline" class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4">
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="hugeicons:plus-sign-square" size="24" class="text-purple-500"/>
          <span class="text-sm">Assign Case to Classroom</span>
        </div>
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px] h-[28rem]">
      <DialogHeader>
        <DialogTitle>Assign Case to Classroom</DialogTitle>
        <DialogDescription>
          Select the case and classroom(s) from the dropdowns below.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="case" class="text-right">
            Case
          </Label>
          <DataComboBox label="Case" :data="props.cases" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="classroom" class="text-right">
            Classroom
          </Label>
         <DataComboBox label="Classroom" :data="props.classrooms" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">
          Assign Case
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>

</style>

