<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="border-b border-gray-200 pb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="text-xs font-medium text-[#4d1979] uppercase tracking-widest mb-2">Admin Management</p>
          <h1 class="text-3xl font-semibold text-gray-900 tracking-tight leading-snug">Administrators</h1>
          <p class="text-gray-500 text-[15px] mt-2 leading-relaxed">Add admins and remove admin access.</p>
          <div class="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#4d1979]">
            <Icon name="lucide:shield" size="13" class="text-white" />
            <span class="text-[13px] font-medium text-white">{{ data.length }} administrators</span>
          </div>
        </div>
        <div class="shrink-0">
          <InviteDialog dialog-type="administrator" />
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div
      v-if="uiError"
      class="flex items-start gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg"
    >
      <Icon name="lucide:alert-circle" class="text-base mt-0.5 shrink-0" />
      {{ uiError }}
    </div>

    <!-- Administrator Table -->
    <div class="overflow-hidden">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>

    <!-- Edit Admin Modal -->
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

const { data, pending, error, refresh } = await useFetch<Administrator[]>(
  "/api/admins",
  {
    default: () => [],
  },
);

const uiError = ref("");

const pageMessage = ref<null | { type: "success" | "error"; text: string }>(
  null,
);

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

const isDeleteModalOpen = ref(false);
const adminToDelete = ref<Administrator | null>(null);
const isDeleting = ref(false);

function handleDeleteClick(admin: Administrator) {
  uiError.value = "";
  adminToDelete.value = admin;
  isDeleteModalOpen.value = true;
}

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

    data.value = data.value.filter((a) => a.userId !== admin.userId);

    isDeleteModalOpen.value = false;
    adminToDelete.value = null;
  } catch (e: any) {
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

const visibleColumns = computed(() =>
  getColumns("admin", {
    onDelete: handleDeleteClick,
  }),
);
</script>
