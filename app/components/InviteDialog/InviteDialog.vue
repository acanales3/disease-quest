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

type DialogType = "student" | "instructor" | "administrator"

const props = defineProps<{
  dialogType: DialogType
}>()

const config: Record<DialogType, { title: string; description: string; defaultEmail: string }> = {
  student: {
    title: "Students",
    description:
      "Enter the email addresses of the students you would like to invite to DiseaseQuest.",
    defaultEmail: "student@tcu.edu",
  },
  instructor: {
    title: "Instructors",
    description:
      "Enter the email addresses of the instructors you would like to invite to DiseaseQuest.",
    defaultEmail: "instructor@tcu.edu",
  },
  administrator: {
    title: "Administrators",
    description:
      "Enter the email addresses of the administrators you would like to invite to DiseaseQuest.",
    defaultEmail: "admin@tcu.edu",
  },
}

const { title, description, defaultEmail } = config[props.dialogType]
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button
        variant="outline"
        class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4"
      >
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="ic:baseline-person-add" size="24" />
          <span class="text-sm">Invite {{ title }}</span>
        </div>
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[425px] h-112">
      <DialogHeader>
        <DialogTitle>Invite {{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="email" class="text-right">Email</Label>
          <Input
            :id="`${dialogType}-email`"
            :default-value="defaultEmail"
            class="col-span-3"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit">Send registration email</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
