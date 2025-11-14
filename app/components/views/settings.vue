<template>
  <div class="w-full max-w-4xl mx-auto px-6 py-8">
    <h1 class="text-3xl font-bold mb-8">Account Settings</h1>

    <!-- Personal Information Section -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Personal Information</h2>
      <div class="grid gap-6 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="firstName" class="text-right">First Name</Label>
          <Input
            id="firstName"
            v-model="form.firstName"
            class="col-span-3"
            placeholder="Enter first name"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="lastName" class="text-right">Last Name</Label>
          <Input
            id="lastName"
            v-model="form.lastName"
            class="col-span-3"
            placeholder="Enter last name"
          />
        </div>
      </div>
    </div>

    <!-- Security Section -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Security</h2>
      <div class="grid gap-6 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="newPassword" class="text-right">New Password</Label>
          <Input
            id="newPassword"
            v-model="form.newPassword"
            type="password"
            class="col-span-3"
            placeholder="Enter new password"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="confirmPassword" class="text-right">Confirm Password</Label>
          <Input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="col-span-3"
            placeholder="Confirm new password"
          />
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" @click="onCancel">Cancel</Button>
      <Button @click="onSave">Save Changes</Button>
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
import { ref } from 'vue';
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

const form = ref({
  firstName: '',
  lastName: '',
  newPassword: '',
  confirmPassword: '',
});

const showConfirmDialog = ref(false);
const showSuccessDialog = ref(false);

const onSave = () => {
  if (!form.value.firstName || !form.value.lastName) {
    alert('Please fill in all required fields.');
    return;
  }
  
  if ((form.value.newPassword || form.value.confirmPassword) && 
      (!form.value.newPassword || !form.value.confirmPassword)) {
    alert('Please fill in both password fields to change your password.');
    return;
  }

  if (form.value.newPassword && form.value.newPassword.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    alert('Passwords do not match.');
    return;
  }

  showConfirmDialog.value = true;
};

const onCancel = () => {
  router.back();
};

const confirmSave = async () => {
  showConfirmDialog.value = false;
  
  // TODO: Add API call to save changes here
  console.log('Saving settings:', form.value);
  
  showSuccessDialog.value = true;
};

const closeSuccessDialog = () => {
  showSuccessDialog.value = false;
  router.back();
};

onMounted(() => {
  // TODO: Load current user data from API
  form.value.firstName = 'John';
  form.value.lastName = 'Doe';
});
</script>