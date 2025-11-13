<template>
  <div class="w-full space-y-6">
    <!-- Page Title -->
    <div class="text-2xl font-semibold text-gray-800">
      Settings
    </div>

    <!-- Settings Container -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Navigation Sidebar -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <nav class="space-y-1">
            <button
              v-for="item in settingsMenu"
              :key="item.id"
              @click="activeSection = item.id"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                activeSection === item.id
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              ]"
            >
              <Icon :name="item.icon" class="text-xl" />
              <span>{{ item.label }}</span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Settings Content Area -->
      <div class="lg:col-span-2">
        <!-- Profile Settings -->
        <div v-if="activeSection === 'profile'" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
              <p class="text-sm text-gray-500 mb-6">Update your account profile information and email address.</p>
            </div>

            <!-- Profile Photo -->
            <div class="flex items-center gap-6">
              <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {{ userInitials }}
              </div>
              <div>
                <button class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  Change Photo
                </button>
                <p class="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 2MB</p>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    v-model="userProfile.firstName"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    v-model="userProfile.lastName"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  v-model="userProfile.email"
                  type="email"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  v-model="userProfile.phone"
                  type="tel"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">School/Institution</label>
                <input
                  v-model="userProfile.school"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter school name"
                />
              </div>

              <div v-if="userRole === 'student'">
                <label class="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  v-model="userProfile.year"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="1">Freshman</option>
                  <option value="2">Sophomore</option>
                  <option value="3">Junior</option>
                  <option value="4">Senior</option>
                  <option value="5">Graduate</option>
                </select>
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                @click="resetProfile"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                @click="saveProfile"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div v-if="activeSection === 'security'" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
              <p class="text-sm text-gray-500 mb-6">Manage your password and security preferences.</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  v-model="securitySettings.currentPassword"
                  type="password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  v-model="securitySettings.newPassword"
                  type="password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  v-model="securitySettings.confirmPassword"
                  type="password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <!-- Two-Factor Authentication -->
            <div class="pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p class="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
                </div>
                <button
                  @click="toggle2FA"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    twoFactorEnabled ? 'bg-purple-600' : 'bg-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                @click="resetSecurity"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                @click="saveSecurity"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications Settings -->
        <div v-if="activeSection === 'notifications'" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <p class="text-sm text-gray-500 mb-6">Manage how you receive notifications.</p>
            </div>

            <div class="space-y-4">
              <div
                v-for="notification in notificationSettings"
                :key="notification.id"
                class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <h4 class="text-sm font-medium text-gray-900">{{ notification.title }}</h4>
                  <p class="text-sm text-gray-500 mt-1">{{ notification.description }}</p>
                </div>
                <button
                  @click="toggleNotification(notification.id)"
                  :class="[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    notification.enabled ? 'bg-purple-600' : 'bg-gray-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      notification.enabled ? 'translate-x-6' : 'translate-x-1'
                    ]"
                  />
                </button>
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                @click="saveNotifications"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>

        <!-- Preferences Settings -->
        <div v-if="activeSection === 'preferences'" class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Application Preferences</h3>
              <p class="text-sm text-gray-500 mb-6">Customize your application experience.</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  v-model="preferences.language"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  v-model="preferences.timezone"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="UTC-8">Pacific Time (PT)</option>
                  <option value="UTC-7">Mountain Time (MT)</option>
                  <option value="UTC-6">Central Time (CT)</option>
                  <option value="UTC-5">Eastern Time (ET)</option>
                </select>
              </div>

              <div class="pt-4 border-t border-gray-200">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">Dark Mode</h4>
                    <p class="text-sm text-gray-500 mt-1">Enable dark theme for the application</p>
                  </div>
                  <button
                    @click="toggleDarkMode"
                    :class="[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      preferences.darkMode ? 'bg-purple-600' : 'bg-gray-200'
                    ]"
                  >
                    <span
                      :class="[
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                      ]"
                    />
                  </button>
                </div>
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                @click="savePreferences"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Determine user role (this would come from auth context in real app)
const userRole = ref<'admin' | 'instructor' | 'student'>('student');

// Active section
const activeSection = ref('profile');

// Settings menu
const settingsMenu = [
  { id: 'profile', label: 'Profile', icon: 'mdi:account-circle-outline' },
  { id: 'security', label: 'Security', icon: 'mdi:shield-lock-outline' },
  { id: 'notifications', label: 'Notifications', icon: 'mdi:bell-outline' },
  { id: 'preferences', label: 'Preferences', icon: 'mdi:cog-outline' },
];

// User profile data
const userProfile = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@tcu.edu',
  phone: '+1 (817) 555-0123',
  school: 'Texas Christian University',
  year: '3',
});

// Security settings
const securitySettings = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const twoFactorEnabled = ref(false);

// Notification settings
const notificationSettings = ref([
  {
    id: 'email',
    title: 'Email Notifications',
    description: 'Receive email updates about your account activity',
    enabled: true,
  },
  {
    id: 'push',
    title: 'Push Notifications',
    description: 'Receive push notifications on your devices',
    enabled: true,
  },
  {
    id: 'assignments',
    title: 'Assignment Reminders',
    description: 'Get notified about upcoming assignments and deadlines',
    enabled: true,
  },
  {
    id: 'grades',
    title: 'Grade Updates',
    description: 'Receive notifications when grades are posted',
    enabled: false,
  },
]);

// Preferences
const preferences = ref({
  language: 'en',
  timezone: 'UTC-6',
  darkMode: false,
});

// Computed
const userInitials = computed(() => {
  return `${userProfile.value.firstName[0]}${userProfile.value.lastName[0]}`.toUpperCase();
});

// Methods
const saveProfile = () => {
  console.log('Saving profile:', userProfile.value);
  // TODO: API call to save profile
  alert('Profile updated successfully!');
};

const resetProfile = () => {
  // Reset to original values
  console.log('Resetting profile');
};

const saveSecurity = () => {
  if (securitySettings.value.newPassword !== securitySettings.value.confirmPassword) {
    alert('Passwords do not match!');
    return;
  }
  console.log('Updating password');
  // TODO: API call to update password
  alert('Password updated successfully!');
  securitySettings.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
};

const resetSecurity = () => {
  securitySettings.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
};

const toggle2FA = () => {
  twoFactorEnabled.value = !twoFactorEnabled.value;
  console.log('2FA toggled:', twoFactorEnabled.value);
};

const toggleNotification = (id: string) => {
  const notification = notificationSettings.value.find(n => n.id === id);
  if (notification) {
    notification.enabled = !notification.enabled;
  }
};

const saveNotifications = () => {
  console.log('Saving notifications:', notificationSettings.value);
  // TODO: API call to save notification preferences
  alert('Notification preferences saved!');
};

const toggleDarkMode = () => {
  preferences.value.darkMode = !preferences.value.darkMode;
};

const savePreferences = () => {
  console.log('Saving preferences:', preferences.value);
  // TODO: API call to save preferences
  alert('Preferences saved successfully!');
};
</script>

<style scoped>
/* Additional custom styles if needed */
</style>