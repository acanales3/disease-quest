<template>
  <div class="w-full max-w-4xl mx-auto py-8 px-4">
    <div class="mb-8">
      <h1 class="text-3xl font-light text-gray-900 mb-2">Settings</h1>
      <p class="text-sm text-gray-600">Manage your account</p>
    </div>

    <div class="bg-white rounded-sm border border-gray-200">
      <div class="p-8">
        <h2 class="text-xl font-light text-gray-900 mb-6">Profile</h2>
        
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-2">
              <Label for="firstName" class="text-sm font-normal text-gray-700">First name</Label>
              <Input
                id="firstName"
                v-model="formData.firstName"
                type="text"
                :class="{ 'border-red-500': errors.firstName }"
                @input="clearError('firstName')"
              />
              <p v-if="errors.firstName" class="text-xs text-red-500">{{ errors.firstName }}</p>
            </div>

            <div class="space-y-2">
              <Label for="lastName" class="text-sm font-normal text-gray-700">Last name</Label>
              <Input
                id="lastName"
                v-model="formData.lastName"
                type="text"
                :class="{ 'border-red-500': errors.lastName }"
                @input="clearError('lastName')"
              />
              <p v-if="errors.lastName" class="text-xs text-red-500">{{ errors.lastName }}</p>
            </div>
          </div>

          <div class="pt-6 mt-6 border-t border-gray-200">
            <h2 class="text-xl font-light text-gray-900 mb-6">Password</h2>
            
            <div class="space-y-4 max-w-md">
              <div class="space-y-2">
                <Label for="currentPassword" class="text-sm font-normal text-gray-700">Current password</Label>
                <Input
                  id="currentPassword"
                  v-model="formData.currentPassword"
                  type="password"
                  :class="{ 'border-red-500': errors.currentPassword }"
                  @input="clearError('currentPassword')"
                />
                <p v-if="errors.currentPassword" class="text-xs text-red-500">{{ errors.currentPassword }}</p>
              </div>

              <div class="space-y-2">
                <Label for="newPassword" class="text-sm font-normal text-gray-700">New password</Label>
                <Input
                  id="newPassword"
                  v-model="formData.newPassword"
                  type="password"
                  :class="{ 'border-red-500': errors.newPassword }"
                  @input="clearError('newPassword')"
                />
                <p v-if="errors.newPassword" class="text-xs text-red-500">{{ errors.newPassword }}</p>
              </div>

              <div class="space-y-2">
                <Label for="confirmPassword" class="text-sm font-normal text-gray-700">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  type="password"
                  :class="{ 'border-red-500': errors.confirmPassword }"
                  @input="clearError('confirmPassword')"
                />
                <p v-if="errors.confirmPassword" class="text-xs text-red-500">{{ errors.confirmPassword }}</p>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-6">
            <Button type="submit" class="px-6" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving...' : 'Save' }}
            </Button>
            <Button type="button" variant="outline" @click="handleCancel" class="px-6">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>

    <Dialog v-model:open="showConfirmDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-normal">Save changes?</DialogTitle>
          <DialogDescription>
            Your account information will be updated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex gap-2 sm:justify-end">
          <Button type="button" @click="confirmSave">Save</Button>
          <Button type="button" variant="outline" @click="showConfirmDialog = false">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showSuccessDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-normal">Changes saved</DialogTitle>
          <DialogDescription>
            Your settings have been updated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" @click="showSuccessDialog = false">OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const router = useRouter();

const formData = reactive({
  firstName: '',
  lastName: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const originalData = reactive({
  firstName: '',
  lastName: '',
});

const errors = reactive({
  firstName: '',
  lastName: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const isSubmitting = ref(false);
const showConfirmDialog = ref(false);
const showSuccessDialog = ref(false);

onMounted(() => {
  const userData = {
    firstName: 'John',
    lastName: 'Doe',
  };

  formData.firstName = userData.firstName;
  formData.lastName = userData.lastName;
  originalData.firstName = userData.firstName;
  originalData.lastName = userData.lastName;
});

function validateForm(): boolean {
  let isValid = true;

  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required';
    isValid = false;
  } else if (formData.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
    isValid = false;
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required';
    isValid = false;
  } else if (formData.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters';
    isValid = false;
  }

  const isPasswordChange = formData.currentPassword || formData.newPassword || formData.confirmPassword;

  if (isPasswordChange) {
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
  }

  return isValid;
}

function clearError(field: keyof typeof errors) {
  errors[field] = '';
}

function handleSubmit() {
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  if (!validateForm()) {
    return;
  }

  showConfirmDialog.value = true;
}

async function confirmSave() {
  showConfirmDialog.value = false;
  isSubmitting.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    originalData.firstName = formData.firstName;
    originalData.lastName = formData.lastName;

    formData.currentPassword = '';
    formData.newPassword = '';
    formData.confirmPassword = '';

    showSuccessDialog.value = true;
  } catch (error) {
    console.error('Error saving settings:', error);
    errors.firstName = 'An error occurred. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  router.back();
}
</script>