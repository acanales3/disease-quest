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
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline" class="h-28 w-48 flex flex-col items-center justify-center gap-2 p-4">
        <div class="flex flex-col items-center justify-center gap-2">
            <Icon name="ic:baseline-person-add" size="24" />
            <span class="text-sm">Invite Students</span>
        </div>
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px] h-[28rem]">
      <DialogHeader>
        <DialogTitle>Invite Students</DialogTitle>
        <DialogDescription>
          Enter the email addresses of the students you would like to invite to DiseaseQuest.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="email" class="text-right">
            Email
          </Label>
          <Input id="email" default-value="student@tcu.edu" class="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="Send">
          Send registration email
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>