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

    <!-- Success / Error banner -->
    <div v-if="pageMessage" class="w-full py-2">
      <div
        class="rounded-md border px-4 py-3 text-sm"
        :class="
          pageMessage.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        {{ pageMessage.text }}
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
  data.value = data.value.map((a) => (a.userId === admin.userId ? admin : a));
  modalBus.closeEdit();
};

// =======================
// Delete modal state
// =======================
const isDeleteModalOpen = ref(false);
const adminToDelete = ref<Administrator | null>(null);
const isDeleting = ref(false);

// Called from dropdown "Delete"
function handleDeleteClick(admin: Administrator) {
  pageMessage.value = null;
  adminToDelete.value = admin;
  isDeleteModalOpen.value = true;
}

// Confirm delete -> call backend API: DELETE /api/admins/:id
async function handleDeleteConfirm(admin: Administrator) {
  pageMessage.value = null;

  if (!admin?.userId) {
    pageMessage.value = { type: "error", text: "Missing admin id." };
    isDeleteModalOpen.value = false;
    adminToDelete.value = null;
    return;
  }

  try {
    isDeleting.value = true;

    const res = await $fetch<any>(`/api/admins/${admin.userId}`, {
      method: "DELETE",
    });

    data.value = data.value.filter((a) => a.userId !== admin.userId);
    isDeleteModalOpen.value = false;
    adminToDelete.value = null;

    pageMessage.value = {
      type: "success",
      text: res?.message || "Administrator deleted successfully.",
    };
  } catch (e: any) {
    pageMessage.value = {
      type: "error",
      text:
        e?.data?.message ||
        e?.message ||
        "Failed to delete administrator. Please try again.",
    };

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
