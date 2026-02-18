<template>
    <div class="w-full max-w-4xl mx-auto px-6 py-8">
        <h1 class="text-3xl font-bold mb-8">Account Settings</h1>

        <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4 pb-2 border-b">
                Profile Name
            </h2>
            <div class="grid gap-6 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="firstName" class="text-right">First Name</Label>
                    <Input
                        id="firstName"
                        v-model="form.firstName"
                        :aria-invalid="Boolean(nameErrors.firstName)"
                        autocomplete="given-name"
                        maxlength="50"
                        class="col-span-3"
                    />
                </div>
                <div
                    v-if="nameErrors.firstName"
                    class="grid grid-cols-4 items-start gap-4 -mt-4"
                >
                    <div />
                    <p class="col-span-3 text-sm text-destructive">
                        {{ nameErrors.firstName }}
                    </p>
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="lastName" class="text-right">Last Name</Label>
                    <Input
                        id="lastName"
                        v-model="form.lastName"
                        :aria-invalid="Boolean(nameErrors.lastName)"
                        autocomplete="family-name"
                        maxlength="50"
                        class="col-span-3"
                    />
                </div>
                <div
                    v-if="nameErrors.lastName"
                    class="grid grid-cols-4 items-start gap-4 -mt-4"
                >
                    <div />
                    <p class="col-span-3 text-sm text-destructive">
                        {{ nameErrors.lastName }}
                    </p>
                </div>
                <div class="grid grid-cols-4 items-start gap-4">
                    <div />
                    <p class="col-span-3 text-sm text-muted-foreground">
                        Use 1 to 50 letters. Spaces, hyphens, and apostrophes
                        are allowed.
                    </p>
                </div>
                <div
                    v-if="nameStatus"
                    class="grid grid-cols-4 items-start gap-4 -mt-2"
                >
                    <div />
                    <p
                        :class="
                            nameStatus.type === 'success'
                                ? 'text-green-600'
                                : 'text-destructive'
                        "
                        class="col-span-3 text-sm"
                    >
                        {{ nameStatus.message }}
                    </p>
                </div>
            </div>
            <div class="flex justify-end gap-3 pt-2 border-t">
                <Button variant="outline" @click="cancelNameEdits"
                    >Cancel</Button
                >
                <Button :disabled="!canSaveName" @click="saveName">
                    {{ isSavingName ? "Saving..." : "Save Name" }}
                </Button>
            </div>
        </div>

        <!-- Security Section -->
        <div class="mb-8">
            <h2 class="text-xl font-semibold mb-4 pb-2 border-b">Security</h2>
            <div class="grid gap-6 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="currentPassword" class="text-right"
                        >Current Password</Label
                    >
                    <Input
                        id="currentPassword"
                        v-model="form.currentPassword"
                        type="password"
                        class="col-span-3"
                        placeholder="Enter current password"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="newPassword" class="text-right"
                        >New Password</Label
                    >
                    <Input
                        id="newPassword"
                        v-model="form.newPassword"
                        type="password"
                        class="col-span-3"
                        placeholder="Enter new password"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="confirmPassword" class="text-right"
                        >Confirm Password</Label
                    >
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

        <!-- Password Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" @click="onCancel">Cancel</Button>
            <Button @click="onSavePassword">Save Password</Button>
        </div>

        <!-- Confirmation Dialog -->
        <Dialog v-model:open="showConfirmDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Changes</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to save these changes to your
                        account?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" @click="showConfirmDialog = false"
                        >Cancel</Button
                    >
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
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const router = useRouter();
const { fetchCustomUser } = useSupabaseAuth();

const form = ref({
    firstName: "",
    lastName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
});

const originalNames = ref({
    firstName: "",
    lastName: "",
});

const showConfirmDialog = ref(false);
const showSuccessDialog = ref(false);
const shouldSignOutAfterSave = ref(false);
const isSavingName = ref(false);
const hasAttemptedNameSave = ref(false);
const nameStatus = ref<null | { type: "success" | "error"; message: string }>(
    null,
);
const nameErrors = ref({
    firstName: "",
    lastName: "",
});

const NAME_PATTERN = /^[\p{L}][\p{L}' -]*$/u;

const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

const hasNameChanges = () => {
    const nextFirst = normalizeName(form.value.firstName);
    const nextLast = normalizeName(form.value.lastName);

    const currentFirst = normalizeName(originalNames.value.firstName);
    const currentLast = normalizeName(originalNames.value.lastName);

    return nextFirst !== currentFirst || nextLast !== currentLast;
};

const validateNameField = (label: string, value: string) => {
    if (!value) {
        return `${label} is required.`;
    }
    if (value.length > 50) {
        return `${label} must be 50 characters or less.`;
    }
    if (!NAME_PATTERN.test(value)) {
        return `${label} can only include letters, spaces, apostrophes, and hyphens.`;
    }
    return "";
};

const runNameValidation = () => {
    const firstName = normalizeName(form.value.firstName);
    const lastName = normalizeName(form.value.lastName);
    nameErrors.value.firstName = validateNameField("First name", firstName);
    nameErrors.value.lastName = validateNameField("Last name", lastName);
    return !nameErrors.value.firstName && !nameErrors.value.lastName;
};

const canSaveName = computed(() => {
    if (isSavingName.value || !hasNameChanges()) {
        return false;
    }
    const firstName = normalizeName(form.value.firstName);
    const lastName = normalizeName(form.value.lastName);
    return (
        !validateNameField("First name", firstName) &&
        !validateNameField("Last name", lastName)
    );
});

const cancelNameEdits = () => {
    form.value.firstName = originalNames.value.firstName;
    form.value.lastName = originalNames.value.lastName;
    nameErrors.value.firstName = "";
    nameErrors.value.lastName = "";
    nameStatus.value = null;
    hasAttemptedNameSave.value = false;
};

const saveName = async () => {
    nameStatus.value = null;
    hasAttemptedNameSave.value = true;
    const firstName = normalizeName(form.value.firstName);
    const lastName = normalizeName(form.value.lastName);
    form.value.firstName = firstName;
    form.value.lastName = lastName;

    if (!runNameValidation()) {
        return;
    }

    if (!hasNameChanges()) {
        nameStatus.value = {
            type: "error",
            message: "No name changes to save.",
        };
        return;
    }

    isSavingName.value = true;
    try {
        const profileResponse = (await $fetch("/api/auth/update-profile", {
            method: "POST",
            body: {
                firstName: form.value.firstName,
                lastName: form.value.lastName,
            },
        })) as { success: boolean; message?: string };

        if (!profileResponse.success) {
            nameStatus.value = {
                type: "error",
                message: profileResponse.message || "Failed to update name.",
            };
            return;
        }

        originalNames.value.firstName = form.value.firstName;
        originalNames.value.lastName = form.value.lastName;
        nameStatus.value = {
            type: "success",
            message: "Name updated successfully.",
        };
    } catch (error: any) {
        nameStatus.value = {
            type: "error",
            message:
                error?.data?.message ||
                error?.message ||
                "An error occurred while updating your name.",
        };
    } finally {
        isSavingName.value = false;
    }
};

const onSavePassword = () => {
    // Check if user is trying to change password
    if (form.value.newPassword || form.value.confirmPassword) {
        if (!form.value.currentPassword) {
            alert(
                "Please enter your current password to change your password.",
            );
            return;
        }

        if (!form.value.newPassword || !form.value.confirmPassword) {
            alert(
                "Please fill in both new password fields to change your password.",
            );
            return;
        }

        if (form.value.newPassword !== form.value.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
    }

    showConfirmDialog.value = true;
};

const onCancel = () => {
    router.back();
};

const confirmSave = async () => {
    showConfirmDialog.value = false;
    shouldSignOutAfterSave.value = false;

    try {
        // Update password if provided
        if (form.value.currentPassword && form.value.newPassword) {
            const response = (await $fetch("/api/auth/update-password", {
                method: "POST",
                body: {
                    currentPassword: form.value.currentPassword,
                    newPassword: form.value.newPassword,
                    confirmPassword: form.value.confirmPassword,
                },
            })) as { success: boolean; message?: string };

            if (!response.success) {
                alert(
                    "Failed to update password: " +
                        (response.message || "Unknown error"),
                );
                return;
            }

            // Clear password fields on success
            form.value.currentPassword = "";
            form.value.newPassword = "";
            form.value.confirmPassword = "";
            shouldSignOutAfterSave.value = true;
        }

        showSuccessDialog.value = true;
    } catch (error: any) {
        const errorMessage =
            error?.data?.message ||
            error?.message ||
            "An error occurred while updating your account.";
        alert("Error: " + errorMessage);
    }
};

const closeSuccessDialog = async () => {
    showSuccessDialog.value = false;

    if (!shouldSignOutAfterSave.value) {
        return;
    }

    try {
        // Clear Supabase session from localStorage since backend already invalidated it
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.includes("supabase")) {
                localStorage.removeItem(key);
            }
        }
    } catch (error) {
        // Error clearing session
    }
    // Reload page to reinitialize Supabase client without cached session
    window.location.href = "/login";
};

onMounted(() => {
    loadCurrentUserName();
});

watch(
    () => [form.value.firstName, form.value.lastName],
    () => {
        if (!hasAttemptedNameSave.value) {
            return;
        }
        runNameValidation();
    },
);

const loadCurrentUserName = async () => {
    try {
        const profile = await fetchCustomUser();
        if (!profile) return;

        const first = (profile.first_name ?? "").trim();
        const last = (profile.last_name ?? "").trim();

        if (first || last) {
            form.value.firstName = first;
            form.value.lastName = last;
            originalNames.value.firstName = first;
            originalNames.value.lastName = last;
            return;
        }

        const fallbackName = (profile.name ?? "").trim();
        if (!fallbackName) return;

        const parts = fallbackName.split(/\s+/).filter(Boolean);
        form.value.firstName = parts[0] ?? "";
        form.value.lastName = parts.slice(1).join(" ");
        originalNames.value.firstName = form.value.firstName;
        originalNames.value.lastName = form.value.lastName;
    } catch (error) {
        console.error(
            "Failed to load current user profile for settings:",
            error,
        );
    }
};
</script>
