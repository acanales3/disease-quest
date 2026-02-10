<template>
  <div class="flex flex-col w-full space-y-4">
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
        {{ error }}
      </div>
    </div>

    <!-- Administrator Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>

    <!-- ✅ Edit Admin Modal (Instructor pattern: modalBus drives it) -->
    <AdminEditAdminDialog
      :show="modalBus.openEditModal"
      :data="modalBus.editData"
      @close="modalBus.closeEdit()"
      @save="saveAdminEdits as any"
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

// Fetch administrators
const { data, pending, error } = await useFetch<Administrator[]>("/api/admins", {
  default: () => [],
});

// FRONTEND-only for now: when dialog saves, update local table and close
const saveAdminEdits = async (admin: Administrator) => {
  data.value = data.value.map((a) => (a.userId === admin.userId ? admin : a));
  modalBus.closeEdit();
};

// Columns: only onDelete forwarded (Edit is handled inside dropdown via modalBus)
const visibleColumns = computed(() =>
  getColumns("admin", {
    onDelete: (admin) => console.log("DELETE clicked (next step):", admin),
  })
);
</script>
