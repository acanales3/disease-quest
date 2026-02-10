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
      <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ error }}
      </div>
    </div>

    <!-- Administrator Table -->
    <div class="w-full py-2">
      <DataTable :columns="visibleColumns" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DataTable from "../../AdminDatatable/data-table.vue";
import { getColumns, type Administrator } from "../../AdminDatatable/columns";
import TotalCount from "@/components/ui/TotalCount.vue";
import InviteDialog from "@/components/InviteDialog/InviteDialog.vue";

// Fetch administrators
const { data, pending, error } = await useFetch<Administrator[]>("/api/admins", {
  default: () => [],
});

// Columns ONLY — no edit/delete handlers
const visibleColumns = computed(() =>
  getColumns("admin")
);
</script>
