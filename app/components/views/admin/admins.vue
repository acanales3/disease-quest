<template>
    <div class="flex flex-col w-full">
        <!-- Administrator Count & Invite -->
        <div class="flex justify-center gap-4">
            <TotalCount
                icon="eos-icons-admin"
                :count="data.length"
                label="Total Administrators"
            />
            <InviteDialog dialog-type="administrator" />
        </div>

        <!-- Fetch / action error banner -->
        <div v-if="uiError" class="w-full py-2">
            <div
                class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
                {{ uiError }}
            </div>
        </div>

        <!-- Administrator Table -->
        <div class="w-full py-2">
            <DataTable :columns="visibleColumns" :data="data" />
        </div>

        <!-- Edit Admin Modal (modalBus drives it) -->
        <AdminEditAdminDialog
            :show="modalBus.openEditModal"
            :data="modalBus.editData"
            @close="modalBus.closeEdit()"
            @save="saveAdminEdits"
        />

        <!-- Delete Admin Modal -->
        <DeleteAdminModal
            v-model:open="isDeleteModalOpen"
            :admin="adminToDelete"
            @confirm="handleDeleteConfirm"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DataTable from "../../AdminDatatable/data-table.vue";
import { getColumns, type Administrator } from "../../AdminDatatable/columns";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

import AdminEditAdminDialog from "@/components/AdminEditAdminDialog/AdminEditAdminDialog.vue";
import { modalBus } from "@/components/AdminEditAdminDialog/modalBusEditAdmin";

import DeleteAdminModal from "@/components/DeleteAdminModal/DeleteAdminModal.vue";

// =======================
// Data fetching
// =======================
const { data, pending, error, refresh } = await useFetch<Administrator[]>(
    "/api/admins",
    {
        default: () => [],
    },
);

// =======================
// Page banner message
// =======================
const pageMessage = ref<null | { type: "success" | "error"; text: string }>(
  null,
);

// =======================
// Edit handling
// =======================
const saveAdminEdits = async (admin: Administrator) => {
    uiError.value = "";

    try {
        const [first_name, ...rest] = (admin.name ?? "").trim().split(" ");
        const last_name = rest.join(" ");

        const response = await $fetch<{
            success: boolean;
            data: Partial<Administrator>;
        }>(`/api/admins/${admin.userId}`, {
            method: "PUT",
            body: {
                first_name,
                last_name,
                school: admin.school,
            },
        });

        data.value = data.value.map((a) =>
            a.userId === admin.userId
                ? {
                      ...a,
                      ...admin,
                      ...response?.data,
                  }
                : a,
        );
        modalBus.closeEdit();
    } catch (e: any) {
        uiError.value =
            e?.data?.statusMessage ||
            e?.data?.message ||
            e?.message ||
            "Failed to update administrator. Please try again.";
    }
};

// =======================
// Delete modal state
// =======================
const isDeleteModalOpen = ref(false);
const adminToDelete = ref<Administrator | null>(null);
const isDeleting = ref(false);

// Called from dropdown "Delete"
function handleDeleteClick(admin: Administrator) {
    uiError.value = "";
    adminToDelete.value = admin;
    isDeleteModalOpen.value = true;
}

// Confirm delete -> call backend API: DELETE /api/admins/:id
async function handleDeleteConfirm(admin: Administrator) {
    uiError.value = "";

    if (!admin?.userId) {
        uiError.value = "Missing admin id.";
        isDeleteModalOpen.value = false;
        adminToDelete.value = null;
        return;
    }

    try {
        isDeleting.value = true;

        await $fetch(`/api/admins/${admin.userId}`, {
            method: "DELETE",
        });

        // Optimistic UI update: remove deleted admin from list
        data.value = data.value.filter((a) => a.userId !== admin.userId);

        // Close modal
        isDeleteModalOpen.value = false;
        adminToDelete.value = null;
    } catch (e: any) {
        // Keep modal closed (it already closes after confirm), but show error banner
        const msg =
            e?.data?.message ||
            e?.message ||
            "Failed to delete administrator. Please try again.";
        uiError.value = msg;

        isDeleteModalOpen.value = false;
        adminToDelete.value = null;
    } finally {
        isDeleting.value = false;
    }
}

// Columns: onDelete opens delete modal
const visibleColumns = computed(() =>
    getColumns("admin", {
        onDelete: handleDeleteClick,
    }),
);
</script>
