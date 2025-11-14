<template>
  <div class="w-full max-w-4xl mx-auto px-6 py-8">
    <h1 class="text-3xl font-bold mb-8">Account Settings</h1>

    <!-- Personal Information Section -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Personal Information</h2>
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="firstName">First Name</Label>
            <Input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              placeholder="Enter first name"
              :class="{ 'border-red-500': errors.firstName }"
            />
            <p v-if="errors.firstName" class="text-sm text-red-500">{{ errors.firstName }}</p>
          </div>

          <div class="space-y-2">
            <Label for="lastName">Last Name</Label>
            <Input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              placeholder="Enter last name"
              :class="{ 'border-red-500': errors.lastName }"
            />
            <p v-if="errors.lastName" class="text-sm text-red-500">{{ errors.lastName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Section -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Security</h2>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            v-model="formData.currentPassword"
            type="password"
            placeholder="Enter current password"
            :class="{ 'border-red-500': errors.currentPassword }"
          />
          <p v-if="errors.currentPassword" class="text-sm text-red-500">{{ errors.currentPassword }}</p>
        </div>

        <div class="space-y-2">
          <Label for="newPassword">New Password</Label>
          <Input
            id="newPassword"
            v-model="formData.newPassword"
            type="password"
            placeholder="Enter new password"
            :class="{ 'border-red-500': errors.newPassword }"
          />
          <p v-if="errors.newPassword" class="text-sm text-red-500">{{ errors.newPassword }}</p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-4 pt-4">
      <Button variant="outline" @click="handleCancel">Cancel</Button>
      <Button @click="handleSave">Save Changes</Button>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog v-model:open="showConfirmDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Changes</DialogTitle>
          <DialogDescription>
            Are you sure you want to save these changes to your account?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showConfirmDialog = false">Cancel</Button>
          <Button @click="confirmSave">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Success Dialog -->
    <Dialog v-model:open="showSuccessDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Success</DialogTitle>
          <DialogDescription>
            Your account settings have been updated successfully.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button @click="closeSuccessDialog">OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
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

// Form data
const formData = reactive({
  firstName: '',
  lastName: '',
  currentPassword: '',
  newPassword: '',
});

// Error messages
const errors = reactive({
  firstName: '',
  lastName: '',
  currentPassword: '',
  newPassword: '',
});

// Dialog states
const showConfirmDialog = ref(false);
const showSuccessDialog = ref(false);

// Validation function
const validateForm = (): boolean => {
  let isValid = true;

  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = '';
  });

  // Validate first name
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required';
    isValid = false;
  }

  // Validate last name
  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required';
    isValid = false;
  }

  // If password fields are filled, validate them
  if (formData.currentPassword || formData.newPassword) {
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required to change password';
      isValid = false;
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }
  }

  return isValid;
};

// Handle save button click
const handleSave = () => {
  if (validateForm()) {
    showConfirmDialog.value = true;
  }
};

// Handle cancel button click
const handleCancel = () => {
  router.back();
};

// Confirm and save changes
const confirmSave = async () => {
  showConfirmDialog.value = false;

  // TODO: Add API call to save changes here
  // await saveUserSettings(formData);

  // Show success dialog
  showSuccessDialog.value = true;
};

// Close success dialog and navigate
const closeSuccessDialog = () => {
  showSuccessDialog.value = false;
  router.back();
};

// Load user data on mount
onMounted(() => {
  // TODO: Load current user data from API
  // For now, using placeholder data
  formData.firstName = 'John';
  formData.lastName = 'Doe';
});
</script>

<style scoped>
/* Additional custom styles if needed */
</style>