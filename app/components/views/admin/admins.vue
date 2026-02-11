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

    <!-- Fetch error banner (helps debugging) -->
    <div v-if="error" class="w-full py-2">
      <div
        class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ (error as any)?.message ?? String(error) }}
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

// Fetch administrators
const { data, pending, error } = await useFetch<Administrator[]>("/api/admins", {
  default: () => [],
});

// Frontend-only for now: when dialog saves, update local table and close
const saveAdminEdits = async (admin: Administrator) => {
  data.value = data.value.map((a) => (a.userId === admin.userId ? admin : a));
  modalBus.closeEdit();
};

// Delete modal state
const isDeleteModalOpen = ref(false);
const adminToDelete = ref<Administrator | null>(null);

// Called from dropdown "Delete"
function handleDeleteClick(admin: Administrator) {
  adminToDelete.value = admin;
  isDeleteModalOpen.value = true;
}

// Frontend-only confirm (API later)
function handleDeleteConfirm(admin: Administrator) {
  console.log("CONFIRM DELETE (next step API):", admin);

  isDeleteModalOpen.value = false;
  adminToDelete.value = null;
}

// Columns: onDelete opens delete modal (Edit handled inside dropdown via modalBus)
const visibleColumns = computed(() =>
  getColumns("admin", {
    onDelete: handleDeleteClick,
  })
);
</script>
