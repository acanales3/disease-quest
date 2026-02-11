<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { Classroom } from '@/components/ClassroomDatatable/columns'

interface EditClassroomData {
    name: string
    code: string
    section: string
    school: string
    start_date: string
    end_date: string
    status: 'active' | 'inactive'
}

interface ValidationResponse {
    isValid: boolean
    errors?: Record<string, string>
}

const props = defineProps<{
    open: boolean
    classroom: Classroom | null
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    updated: [classroom: Classroom]
}>()

const STEPS = {
    FORM: 'form',
    VALIDATION: 'validation',
    CONFIRM: 'confirm',
    RESULT: 'result',
} as const

type Step = (typeof STEPS)[keyof typeof STEPS]

const step = ref<Step>(STEPS.FORM)
const isLoading = ref(false)
const validationData = ref<EditClassroomData | null>(null)
const updateResult = ref<{ success: boolean; message: string } | null>(null)
const errors = ref<Record<string, string>>({})

const form = ref<EditClassroomData>({
    name: '',
    code: '',
    section: '',
    school: '',
    start_date: '',
    end_date: '',
    status: 'active',
})

const dialogTitle = computed(() => {
    switch (step.value) {
        case STEPS.FORM:
            return `Edit ${form.value.name || 'Classroom'}`
        case STEPS.VALIDATION:
            return 'Validating Changes...'
        case STEPS.CONFIRM:
            return 'Confirm Changes'
        case STEPS.RESULT:
            return updateResult.value?.success
                ? 'Update Successful'
                : 'Update Failed'
        default:
            return 'Edit Classroom'
    }
})

const dialogDescription = computed(() => {
    switch (step.value) {
        case STEPS.FORM:
            return 'Update the classroom name and description.'
        case STEPS.VALIDATION:
            return 'Validating your changes...'
        case STEPS.CONFIRM:
            return 'Please review and confirm the changes below.'
        case STEPS.RESULT:
            return updateResult.value?.message || ''
        default:
            return ''
    }
})

function populateForm(classroom: Classroom) {
    form.value = {
        name: classroom.name,
        code: classroom.code,
        section: classroom.section,
        school: classroom.school,
        start_date: classroom.startDate,
        end_date: classroom.endDate,
        status: classroom.status,
    }
}

// When modal opens, populate form with classroom data
watch(
    () => [props.open, props.classroom] as const,
    ([isOpen, classroom]) => {
        if (isOpen && classroom) {
            resetState()
            populateForm(classroom)
        }
    },
    { immediate: true },
)

function resetState() {
    step.value = STEPS.FORM
    errors.value = {}
    validationData.value = null
    updateResult.value = null
    isLoading.value = false
}

function validateForm(): boolean {
    errors.value = {}

    if (form.value.name !== undefined && form.value.name !== null) {
        if (!form.value.name.trim()) {
            errors.value.name = 'Classroom name cannot be empty'
        } else if (form.value.name.length > 255) {
            errors.value.name = 'Classroom name cannot exceed 255 characters'
        }
    }

    if (form.value.code !== undefined && form.value.code !== null) {
        if (!form.value.code.trim()) {
            errors.value.code = 'Course code cannot be empty'
        }
    }

    if (form.value.section !== undefined && form.value.section !== null) {
        if (!form.value.section.trim()) {
            errors.value.section = 'Section cannot be empty'
        }
    }

    if (form.value.school !== undefined && form.value.school !== null) {
        if (!form.value.school.trim()) {
            errors.value.school = 'School cannot be empty'
        }
    }

    if (
        form.value.start_date &&
        form.value.end_date &&
        form.value.start_date > form.value.end_date
    ) {
        errors.value.end_date = 'End date must be after start date'
    }

    return Object.keys(errors.value).length === 0
}

function normalizeForm(): EditClassroomData {
    return {
        name: form.value.name.trim(),
        code: form.value.code.trim(),
        section: form.value.section.trim(),
        school: form.value.school.trim(),
        start_date: form.value.start_date,
        end_date: form.value.end_date,
        status: form.value.status,
    }
}

function hasChanges(
    nextValue: EditClassroomData,
    current: Classroom,
): boolean {
    return (
        nextValue.name !== current.name ||
        nextValue.code !== current.code ||
        nextValue.section !== current.section ||
        nextValue.school !== current.school ||
        nextValue.start_date !== current.startDate ||
        nextValue.end_date !== current.endDate ||
        nextValue.status !== current.status
    )
}

async function handleSubmit() {
    if (!props.classroom) {
        errors.value = { general: 'No classroom selected' }
        return
    }

    if (!validateForm()) {
        return
    }

    const normalized = normalizeForm()
    if (!hasChanges(normalized, props.classroom)) {
        errors.value = { general: 'No changes to update' }
        return
    }

    isLoading.value = true
    step.value = STEPS.VALIDATION

    try {
        const response = await $fetch<ValidationResponse>(
            `/api/classrooms/${props.classroom.id}/validate`,
            {
                method: 'POST',
                body: normalized,
            },
        )

        if (!response.isValid) {
            errors.value = response.errors || {}
            step.value = STEPS.FORM
            return
        }

        validationData.value = normalized
        step.value = STEPS.CONFIRM
    } catch (error: any) {
        console.error('Validation error:', error)
        errors.value = { general: error.message || 'Validation failed' }
        step.value = STEPS.FORM
    } finally {
        isLoading.value = false
    }
}

async function handleConfirm() {
    isLoading.value = true
    step.value = STEPS.RESULT
    errors.value = {}

    try {
        // Call backend update endpoint
        const response = await $fetch<{
            success: boolean
            message: string
            classroom: Classroom
        }>(`/api/classrooms/${props.classroom?.id}`, {
            method: 'PATCH',
            body: validationData.value,
        })

        updateResult.value = response

        if (response.success && response.classroom) {
            // Emit updated event with all updated classroom data from server
            emit('updated', response.classroom)
        }
    } catch (error: any) {
        console.error('Update error:', error)
        updateResult.value = {
            success: false,
            message: error.message || 'Update failed',
        }
    } finally {
        isLoading.value = false
    }
}

function backToForm() {
    step.value = STEPS.FORM
    errors.value = {}
}

function closeDialog() {
    emit('update:open', false)
}

function handleDialogOpenChange(value: boolean) {
    if (!value) {
        closeDialog()
    }
}
</script>

<template>
    <Dialog :open="open" @update:open="handleDialogOpenChange">
        <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{{ dialogTitle }}</DialogTitle>
                <DialogDescription>{{ dialogDescription }}</DialogDescription>
            </DialogHeader>

            <div class="mt-4">
                <Transition name="fade" mode="out-in">
                    <!-- FORM STEP -->
                    <div
                        v-if="step === STEPS.FORM"
                        key="form"
                        class="grid gap-6 py-4"
                    >
                        <label class="flex flex-col gap-2">
                            <Label for="name">Classroom Name</Label>
                            <Input
                                id="name"
                                v-model="form.name"
                                placeholder="Enter classroom name"
                                :class="{ 'border-red-500': errors.name }"
                            />
                            <p v-if="errors.name" class="text-red-500 text-xs">
                                {{ errors.name }}
                            </p>
                        </label>

                        <label class="flex flex-col gap-2">
                            <Label for="code">Course Code</Label>
                            <Input
                                id="code"
                                v-model="form.code"
                                placeholder="e.g., BIOL 10123"
                                :class="{ 'border-red-500': errors.code }"
                            />
                            <p v-if="errors.code" class="text-red-500 text-xs">
                                {{ errors.code }}
                            </p>
                        </label>

                        <label class="flex flex-col gap-2">
                            <Label for="section">Section</Label>
                            <Input
                                id="section"
                                v-model="form.section"
                                placeholder="e.g., 001"
                                :class="{ 'border-red-500': errors.section }"
                            />
                            <p
                                v-if="errors.section"
                                class="text-red-500 text-xs"
                            >
                                {{ errors.section }}
                            </p>
                        </label>

                        <label class="flex flex-col gap-2">
                            <Label for="school">School</Label>
                            <Input
                                id="school"
                                v-model="form.school"
                                placeholder="Enter school name"
                                :class="{ 'border-red-500': errors.school }"
                            />
                            <p
                                v-if="errors.school"
                                class="text-red-500 text-xs"
                            >
                                {{ errors.school }}
                            </p>
                        </label>

                        <label class="flex flex-col gap-2">
                            <Label for="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                v-model="form.start_date"
                                :class="{ 'border-red-500': errors.start_date }"
                            />
                            <p
                                v-if="errors.start_date"
                                class="text-red-500 text-xs"
                            >
                                {{ errors.start_date }}
                            </p>
                        </label>

                        <label class="flex flex-col gap-2">
                            <Label for="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                v-model="form.end_date"
                                :class="{ 'border-red-500': errors.end_date }"
                            />
                            <p
                                v-if="errors.end_date"
                                class="text-red-500 text-xs"
                            >
                                {{ errors.end_date }}
                            </p>
                        </label>

                        <label class="flex flex-col gap-2">
                            <Label for="status">Status</Label>
                            <select
                                id="status"
                                v-model="form.status"
                                class="p-2 border rounded"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>

                        <p v-if="errors.general" class="text-red-500 text-sm">
                            {{ errors.general }}
                        </p>
                    </div>

                    <!-- VALIDATION STEP -->
                    <div
                        v-else-if="step === STEPS.VALIDATION"
                        key="validation"
                        class="flex flex-col items-center justify-center py-8 gap-4"
                    >
                        <Icon
                            name="eos-icons:loading"
                            size="32"
                            class="animate-spin"
                        />
                        <p class="text-gray-600">Validating your changes...</p>
                    </div>

                    <!-- CONFIRM STEP -->
                    <div
                        v-else-if="step === STEPS.CONFIRM"
                        key="confirm"
                        class="grid gap-4 py-4"
                    >
                        <div
                            class="bg-blue-50 border border-blue-200 rounded p-4"
                        >
                            <h3 class="font-semibold text-blue-900 mb-3">
                                Review Changes
                            </h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >Name:</span
                                    >
                                    <span class="text-gray-900">{{
                                        validationData?.name
                                    }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >Code:</span
                                    >
                                    <span class="text-gray-900">{{
                                        validationData?.code
                                    }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >Section:</span
                                    >
                                    <span class="text-gray-900">{{
                                        validationData?.section
                                    }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >School:</span
                                    >
                                    <span class="text-gray-900">{{
                                        validationData?.school
                                    }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >Start Date:</span
                                    >
                                    <span class="text-gray-900">{{
                                        validationData?.start_date
                                    }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >End Date:</span
                                    >
                                    <span class="text-gray-900">{{
                                        validationData?.end_date
                                    }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium text-gray-700"
                                        >Status:</span
                                    >
                                    <span class="text-gray-900 capitalize">{{
                                        validationData?.status
                                    }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- RESULT STEP -->
                    <div
                        v-else-if="step === STEPS.RESULT"
                        key="result"
                        class="flex flex-col items-center justify-center py-8 gap-4"
                    >
                        <template v-if="isLoading || !updateResult">
                            <Icon
                                name="eos-icons:loading"
                                size="32"
                                class="animate-spin"
                            />
                            <p class="text-gray-600">Updating classroom...</p>
                        </template>
                        <template v-else>
                            <Icon
                                :name="
                                    updateResult.success
                                        ? 'mdi:check-circle'
                                        : 'mdi:alert-circle'
                                "
                                size="48"
                                :class="
                                    updateResult.success
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                "
                            />
                            <p class="text-center text-gray-700">
                                {{ updateResult.message }}
                            </p>
                        </template>
                    </div>
                </Transition>

                <!-- FOOTER BUTTONS -->
                <div class="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <template v-if="step === STEPS.FORM">
                        <Button
                            variant="outline"
                            type="button"
                            @click="closeDialog"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            @click="handleSubmit"
                            :disabled="isLoading"
                        >
                            {{ isLoading ? 'Validating...' : 'Submit' }}
                        </Button>
                    </template>

                    <template v-else-if="step === STEPS.VALIDATION">
                        <p class="text-gray-600">Please wait...</p>
                    </template>

                    <template v-else-if="step === STEPS.CONFIRM">
                        <Button
                            variant="outline"
                            type="button"
                            @click="backToForm"
                        >
                            Back to Edit
                        </Button>
                        <Button
                            type="button"
                            @click="handleConfirm"
                            :disabled="isLoading"
                        >
                            {{ isLoading ? 'Updating...' : 'Confirm' }}
                        </Button>
                    </template>

                    <template v-else-if="step === STEPS.RESULT">
                        <Button type="button" @click="closeDialog" :disabled="isLoading">
                            {{ updateResult?.success ? 'Done' : 'Close' }}
                        </Button>
                    </template>
                </div>
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
