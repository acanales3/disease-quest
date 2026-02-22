<script setup lang="ts">
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "#components";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const props = defineProps<{
    open: boolean;
}>();

const emit = defineEmits<{
    "update:open": [value: boolean]
    joined: [response: { classroomId: number, classroomName: string }];
}>();

const inviteCode = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const touched = ref(false);


function reset() {
    inviteCode.value = "";
    errorMessage.value = "";
    successMessage.value = "";
    touched.value = false;
    isLoading.value = false;
}

function onCancel() {
    reset();
    emit("update:open", false);
}

async function joinClassroom() {
    if (isLoading.value) return;

    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    try {
        const response = await $fetch<{ classroomId: number, classroomName: string }>(
            "/api/classrooms/join",
            {
                method: "POST",
                body: {
                    inviteCode: inviteCode.value.trim(),
                },
            }
        );

        successMessage.value = `Successfully joined ${response.classroomName}`
        emit("joined", response);
        
        setTimeout(() => {
            reset();
            emit("update:open", false);
        }, 1200);
    } catch (error: any) {
        errorMessage.value = 
            error?.data?.message ||
            error?.statusMessage || 
            "Failed to join classroom";
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
  <Dialog 
    :open="open" 
    @update:open="(value) => {
        emit('update:open', value);
        if (!value) reset();
    }">
    <div class="flex flex-col items-center justify-center gap-2">
        <Icon name="ic:baseline-person-add" size="24" />
        <span class="text-sm">Join Classroom</span>
    </div>
    <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Join Classroom</DialogTitle>
        <DialogDescription>Enter the classroom invitation code provided by your instructor</DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid grid-cols-4 items-start gap-4">
            <Label for="inviteCode" class="text-right pt-2">
                Invitation Code
            </Label>

            <div class="col-span-3">
                <Input
                    id="inviteCode"
                    v-model="inviteCode"
                    placeholder="Enter invitation code"
                />
            </div>
        </div>

        <div
            v-if="errorMessage"
            class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm"
        >
        {{  errorMessage }}
        </div>

        <div
            v-if="successMessage"
            class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm"
        >
        {{ successMessage }}
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6 pt-6 border-t">
        <Button variant="outline" type="button" @click="onCancel">Cancel</Button>
        <Button type="button" :disabled="isLoading" @click="joinClassroom">
            <template v-if="isLoading">
                Joining...
            </template>
            <template v-else>
                Join Classroom
            </template>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
