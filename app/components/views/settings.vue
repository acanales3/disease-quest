<template>
    <div class="min-h-screen bg-[#f5f5f7]">
        <div class="w-full max-w-4xl mx-auto px-6 py-10">
            <!-- Page header -->
            <div class="mb-8 flex items-start justify-between">
                <div>
                    <h1 class="text-3xl font-semibold text-gray-900">Account Settings</h1>
                    <p class="mt-2 text-sm text-gray-500 max-w-xl">
                        Manage your personal details, contact information, and password
                        for your account.
                    </p>
                </div>
                <Button
                    variant="outline"
                    class="border-gray-300 text-gray-700 hover:bg-gray-50"
                    @click="goBack"
                >
                    <Icon name="lucide:arrow-left" size="14" class="mr-2" />
                    Back
                </Button>
            </div>

            <!-- Profile card -->
            <section
                class="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
                <div class="px-6 py-5 border-b border-gray-100 flex items-start gap-6">
                    <!-- Student avatar (instead of upload picture) -->
                    <div
                        v-if="isStudent"
                        class="flex items-center justify-center w-20 h-20 rounded-full bg-[#f5f3ff] overflow-hidden shrink-0"
                    >
                        <img
                            v-if="avatarUrl"
                            :src="avatarUrl"
                            :alt="currentNickname || 'Student avatar'"
                            class="w-full h-full object-contain"
                        />
                        <Icon
                            v-else-if="avatarLoading"
                            name="lucide:loader-2"
                            size="22"
                            class="text-[#4d1979]/40 animate-spin"
                        />
                        <Icon
                            v-else
                            name="lucide:user"
                            size="26"
                            class="text-[#4d1979]/30"
                        />
                    </div>

                    <div class="flex-1">
                    
                        <h2 class="mt-1 text-base font-semibold text-gray-900">
                            Profile details
                        </h2>
                        
                        <p
                            v-if="isStudent"
                            class="mt-2 text-xs text-gray-400"
                        >
                            Your avatar and nickname are generated automatically to help
                            keep your identity private in leaderboards.
                        </p>
                    </div>
                </div>

                <!-- Nickname (students) on top, then full name -->
                <div class="px-6 py-6 space-y-8">
                    <!-- Nickname (students only) -->
                    <div
                        v-if="isStudent"
                        class="space-y-4"
                    >
                        
                        <div>
                            <Label class="text-xs text-gray-600"
                                >Current nickname</Label
                            >
                            <div
                                class="mt-2 inline-flex items-center rounded-md bg-[#f5f3ff] px-4 py-2"
                            >
                                <span
                                    class="text-sm font-medium text-[#4d1979]"
                                >
                                    {{ currentNickname || "Not assigned" }}
                                </span>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <Label
                                for="nicknameInput"
                                class="text-xs text-gray-600"
                                >New nickname</Label
                            >
                            <div
                                class="flex flex-col gap-2 sm:flex-row sm:items-center"
                            >
                                <Input
                                    id="nicknameInput"
                                    v-model="nicknameInput"
                                    maxlength="30"
                                    placeholder="Enter a custom nickname"
                                    class="flex-1"
                                />
                                <Button
                                    class="bg-black text-white hover:bg-gray-800 sm:w-auto w-full"
                                    :disabled="
                                        isSavingNickname || !canSaveNickname
                                    "
                                    @click="requestNicknameSave"
                                >
                                    {{
                                        isSavingNickname ? "Saving..." : "Save"
                                    }}
                                </Button>
                            </div>
                            <p class="text-xs text-gray-500">
                                2 to 30 characters. Must be unique.
                            </p>
                        </div>
                        <p
                            v-if="nicknameStatus"
                            :class="
                                nicknameStatus.type === 'success'
                                    ? 'text-green-600'
                                    : 'text-destructive'
                            "
                            class="text-xs"
                        >
                            {{ nicknameStatus.message }}
                        </p>
                        <div class="flex justify-end">
                            <Button
                                variant="outline"
                                class="border-gray-300 text-gray-700 hover:bg-gray-50"
                                :disabled="isRegeneratingNickname"
                                @click="requestNicknameGenerate"
                            >
                                {{
                                    isRegeneratingNickname
                                        ? "Generating..."
                                        : "Generate random nickname"
                                }}
                            </Button>
                        </div>
                    </div>

                    <!-- Full name -->
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-sm font-medium text-gray-800">
                                Full name
                            </h3>
                            <p class="mt-1 text-xs text-gray-500">
                                Use 1 to 50 letters. Spaces, hyphens, and
                                apostrophes are allowed.
                            </p>
                        </div>
                        <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label
                                    for="firstName"
                                    class="text-xs text-gray-600"
                                    >First name</Label
                                >
                                <Input
                                    id="firstName"
                                    v-model="form.firstName"
                                    :aria-invalid="Boolean(nameErrors.firstName)"
                                    autocomplete="given-name"
                                    maxlength="50"
                                    class="mt-1"
                                />
                                <p
                                    v-if="nameErrors.firstName"
                                    class="mt-1 text-xs text-destructive"
                                >
                                    {{ nameErrors.firstName }}
                                </p>
                            </div>
                            <div>
                                <Label
                                    for="lastName"
                                    class="text-xs text-gray-600"
                                    >Last name</Label
                                >
                                <Input
                                    id="lastName"
                                    v-model="form.lastName"
                                    :aria-invalid="Boolean(nameErrors.lastName)"
                                    autocomplete="family-name"
                                    maxlength="50"
                                    class="mt-1"
                                />
                                <p
                                    v-if="nameErrors.lastName"
                                    class="mt-1 text-xs text-destructive"
                                >
                                    {{ nameErrors.lastName }}
                                </p>
                            </div>
                        </div>
                        <p
                            v-if="nameStatus"
                            :class="
                                nameStatus.type === 'success'
                                    ? 'text-green-600'
                                    : 'text-destructive'
                            "
                            class="text-xs"
                        >
                            {{ nameStatus.message }}
                        </p>
                        <div class="flex justify-end">
                            <Button
                                class="bg-black text-white hover:bg-gray-800"
                                :disabled="!canSaveName"
                                @click="saveName"
                            >
                                {{ isSavingName ? "Saving..." : "Save name" }}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Contact email -->
            <section
                class="mb-8 rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
                <div class="px-6 py-5 border-b border-gray-100">
                    <h2 class="mt-1 text-base font-semibold text-gray-900">
                        Account email
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 max-w-md">
                        The email address used for this account.
                    </p>
                </div>
                <div class="px-6 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="w-full sm:max-w-sm">
                        <Label class="text-xs text-gray-600">Email</Label>
                        <div class="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
                            <Icon
                                name="lucide:mail"
                                size="16"
                                class="text-gray-400"
                            />
                            <span class="text-sm text-gray-800 truncate">
                                {{ primaryEmail || "No email on file" }}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Security / password -->
            <section
                class="rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
                <div class="px-6 py-5 border-b border-gray-100">
                    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Password
                    </p>
                    <h2 class="mt-1 text-base font-semibold text-gray-900">
                        Change password
                    </h2>
                    <p class="mt-1 text-sm text-gray-500 max-w-md">
                        Modify your current password to keep your account secure.
                    </p>
                </div>
                <div class="px-6 py-6 space-y-5">
                    <div class="space-y-4">
                        <div
                            class="grid items-center gap-4 sm:grid-cols-[150px,minmax(0,1fr)]"
                        >
                            <Label
                                for="currentPassword"
                                class="text-xs font-medium text-gray-700"
                            >
                                Current password
                            </Label>
                            <Input
                                id="currentPassword"
                                v-model="form.currentPassword"
                                type="password"
                                class="mt-1"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div
                            class="grid items-center gap-4 sm:grid-cols-[150px,minmax(0,1fr)]"
                        >
                            <Label
                                for="newPassword"
                                class="text-xs font-medium text-gray-700"
                            >
                                New password
                            </Label>
                            <Input
                                id="newPassword"
                                v-model="form.newPassword"
                                type="password"
                                class="mt-1"
                                placeholder="Enter new password"
                            />
                        </div>
                        <div
                            class="grid items-center gap-4 sm:grid-cols-[150px,minmax(0,1fr)]"
                        >
                            <Label
                                for="confirmPassword"
                                class="text-xs font-medium text-gray-700"
                            >
                                Confirm password
                            </Label>
                            <Input
                                id="confirmPassword"
                                v-model="form.confirmPassword"
                                type="password"
                                class="mt-1"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                    <div class="flex justify-end pt-2">
                        <Button
                            class="bg-black text-white hover:bg-gray-800"
                            @click="onSavePassword"
                        >
                            Save password
                        </Button>
                    </div>
                </div>
            </section>

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
                    <Button variant="outline" class="border-gray-300 text-gray-700 hover:bg-gray-50" @click="showConfirmDialog = false"
                        >Cancel</Button
                    >
                    <Button class="bg-black text-white hover:bg-gray-800" @click="confirmSave">Confirm</Button>
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
                    <Button class="bg-black text-white hover:bg-gray-800" @click="closeSuccessDialog">OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <!-- Nickname Confirmation Dialog -->
        <Dialog v-model:open="showNicknameConfirmDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Nickname Update</DialogTitle>
                    <DialogDescription>
                        {{
                            pendingNicknameAction === "random"
                                ? "Generate a new random nickname? This will replace your current nickname."
                                : `Save this nickname: "${pendingNicknameValue}"?`
                        }}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        class="border-gray-300 text-gray-700 hover:bg-gray-50"
                        @click="showNicknameConfirmDialog = false"
                    >
                        Cancel
                    </Button>
                    <Button class="bg-black text-white hover:bg-gray-800" @click="confirmNicknameUpdate">
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "#components";
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

const isStudent = ref(false);
const primaryEmail = ref("");
const currentNickname = ref("");
const nicknameInput = ref("");
const isRegeneratingNickname = ref(false);
const isSavingNickname = ref(false);
const nicknameStatus = ref<null | { type: "success" | "error"; message: string }>(
    null,
);
const showNicknameConfirmDialog = ref(false);
const pendingNicknameAction = ref<"custom" | "random" | null>(null);
const pendingNicknameValue = ref("");

const avatarUrl = ref<string | null>(null);
const avatarLoading = ref(false);
let avatarPollTimer: ReturnType<typeof setTimeout> | null = null;

async function checkAvatar(regenerate = false) {
    try {
        const query = regenerate ? "?regenerate=true" : "";
        const result = await $fetch<{ avatarUrl: string | null; generating: boolean }>(`/api/students/avatar${query}`);
        if (result.avatarUrl) {
            avatarUrl.value = result.avatarUrl;
            avatarLoading.value = false;
            return;
        }
        if (result.generating) {
            avatarLoading.value = true;
            avatarPollTimer = setTimeout(() => checkAvatar(), 4000);
            return;
        }
        avatarLoading.value = false;
    } catch {
        avatarUrl.value = null;
        avatarLoading.value = false;
    }
}

const nicknameInitialized = ref(false);
watch(currentNickname, (nick) => {
    if (avatarPollTimer) { clearTimeout(avatarPollTimer); avatarPollTimer = null; }
    if (!nick) return;
    if (!nicknameInitialized.value) {
        nicknameInitialized.value = true;
        return;
    }
    avatarLoading.value = true;
    avatarUrl.value = null;
    checkAvatar(true);
});

onUnmounted(() => {
    if (avatarPollTimer) clearTimeout(avatarPollTimer);
});

const canSaveNickname = computed(() => {
    const trimmed = nicknameInput.value.trim();
    return trimmed.length >= 2 && trimmed.length <= 30;
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

const goBack = () => {
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

const requestNicknameSave = () => {
    const trimmed = nicknameInput.value.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return;
    pendingNicknameAction.value = "custom";
    pendingNicknameValue.value = trimmed;
    showNicknameConfirmDialog.value = true;
};

const requestNicknameGenerate = () => {
    pendingNicknameAction.value = "random";
    pendingNicknameValue.value = "";
    showNicknameConfirmDialog.value = true;
};

const saveCustomNickname = async (trimmed: string) => {
    if (trimmed.length < 2 || trimmed.length > 30) return;

    isSavingNickname.value = true;
    nicknameStatus.value = null;
    try {
        const result = await $fetch<{ nickname: string }>(
            "/api/students/nickname",
            { method: "POST", body: { nickname: trimmed } },
        );
        currentNickname.value = result.nickname;
        nicknameInput.value = "";
        nicknameStatus.value = {
            type: "success",
            message: "Nickname updated successfully.",
        };
    } catch (error: any) {
        nicknameStatus.value = {
            type: "error",
            message:
                error?.data?.statusMessage ||
                error?.message ||
                "Failed to save nickname.",
        };
    } finally {
        isSavingNickname.value = false;
    }
};

const regenerateNickname = async () => {
    isRegeneratingNickname.value = true;
    nicknameStatus.value = null;
    try {
        const result = await $fetch<{ nickname: string }>(
            "/api/students/nickname",
            { method: "POST" },
        );
        currentNickname.value = result.nickname;
        nicknameInput.value = "";
        nicknameStatus.value = {
            type: "success",
            message: "Nickname updated successfully.",
        };
    } catch (error: any) {
        nicknameStatus.value = {
            type: "error",
            message:
                error?.data?.statusMessage ||
                error?.message ||
                "Failed to generate new nickname.",
        };
    } finally {
        isRegeneratingNickname.value = false;
    }
};

const confirmNicknameUpdate = async () => {
    showNicknameConfirmDialog.value = false;
    if (pendingNicknameAction.value === "custom") {
        await saveCustomNickname(pendingNicknameValue.value);
    } else if (pendingNicknameAction.value === "random") {
        await regenerateNickname();
    }
    pendingNicknameAction.value = null;
    pendingNicknameValue.value = "";
};

const fetchNickname = async () => {
    try {
        const result = await $fetch<{ nickname: string | null }>(
            "/api/students/nickname",
        );
        const nick = result.nickname ?? "";
        currentNickname.value = nick;
        if (nick) {
            avatarLoading.value = true;
            checkAvatar();
        }
    } catch {
        // Student record may not exist yet
    }
};

const loadCurrentUserName = async () => {
    try {
        const profile = await fetchCustomUser();
        if (!profile) return;

        primaryEmail.value = (profile.email ?? "").trim();

        if (profile.role?.toUpperCase() === "STUDENT") {
            isStudent.value = true;
            fetchNickname();
        }

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
