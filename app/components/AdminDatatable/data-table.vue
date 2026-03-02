<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/vue-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  getFilteredRowModel,
} from "@tanstack/vue-table";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FilterDialog from "@/components/FilterDialog/FilterDialog.vue";

import { ChevronDown } from "lucide-vue-next";
import { computed, ref } from "vue";
import { valueUpdater } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}>();

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
});

const hideableColumns = computed(() =>
  table.getAllColumns().filter((column) => column.getCanHide())
);

const handleApplyFilters = (filters: any) => {
  table.getColumn("name")?.setFilterValue(filters.name || undefined);
  table.getColumn("email")?.setFilterValue(filters.email || undefined);
  table.getColumn("school")?.setFilterValue(filters.school || undefined);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 w-full max-w-full min-w-0 overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <p class="text-sm font-medium text-gray-900">Records</p>

      <div class="flex items-center gap-2">
        <FilterDialog
          :show-msyear="false"
          :show-classroom="false"
          :show-status="false"
          :balanced-basic-layout="true"
          @apply-filters="handleApplyFilters"
        />

        <div class="relative">
          <Icon name="lucide:search" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            class="h-8 pl-8 pr-3 text-sm w-56 border-gray-200 bg-white rounded-lg placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#4d1979]/30 focus-visible:border-[#4d1979]"
            placeholder="Search by email..."
            :model-value="table.getColumn('email')?.getFilterValue() as string"
            @update:model-value="table.getColumn('email')?.setFilterValue($event)"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Columns
              <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              v-for="column in hideableColumns"
              :key="column.id"
              class="capitalize"
              :modelValue="column.getIsVisible()"
              @update:modelValue="(value: boolean) => column.toggleVisibility(!!value)"
            >
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <Table class="w-full text-sm">
        <TableHeader>
          <TableRow class="border-b border-gray-100 hover:bg-transparent">
            <TableHead
              v-for="header in table.getHeaderGroups()[0]?.headers"
              :key="header.id"
              class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400 px-5 py-3 bg-gray-50/60"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              class="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-5 py-3.5 text-left text-gray-700"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow>
              <TableCell :colspan="columns.length" class="h-32 text-center text-sm text-gray-400">
                No records found.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
      <p class="text-xs text-gray-400">
        Showing {{ table.getRowModel().rows.length }} of {{ table.getFilteredRowModel().rows.length }} records
      </p>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <Icon name="lucide:chevron-left" size="14" />
          Previous
        </button>
        <button
          class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Next
          <Icon name="lucide:chevron-right" size="14" />
        </button>
      </div>
    </div>
  </div>
</template>
