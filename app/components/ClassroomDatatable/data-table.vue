<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/vue-table";

import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable,
} from "@tanstack/vue-table";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ref, onMounted } from "vue";
import { valueUpdater } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

// Import the new ClassroomFilterDialog
import ClassroomFilterDialog from "../ClassroomFilterDialog/ClassroomFilterDialog.vue";

const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    rowLength?: number;
  }>(),
  { rowLength: 10 }
);

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});

// --------------------------
// Create table instance
// --------------------------
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    // Override the status column to use exact-match filter
    return props.columns.map((col) => {
      if (col.id === "status" || (col as any).accessorKey === "status") {
        return {
          ...col,
          filterFn: (row, columnId, filterValues: string[]) => {
            const cellValue = (row.getValue(columnId) ?? "").toString().toLowerCase();
            if (!filterValues.length) return true; // no filter, show all
            return filterValues.includes(cellValue); // exact match only
          },
        } as ColumnDef<TData, TValue>;
      }
      return col;
    });
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
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
  initialState: {
    pagination: {
      pageSize: props.rowLength,
      pageIndex: 0,
    },
  },
});

onMounted(() => {
  props.columns.forEach((col) => {
    const key = (col.id ?? (col as any).accessorKey) as string;
    if ((col as any).meta?.hidden) {
      table.getColumn(key)?.toggleVisibility(false);
    }
  });
});

// --------------------------
// Apply filters from ClassroomFilterDialog
// --------------------------
const applyClassroomFilters = (filters: {
  name: string;
  code: string;
  instructor: string;
  school: string;
  section: string;
  startDate: string;
  endDate: string;
  status: string[];
}) => {
  table.getColumn("name")?.setFilterValue(filters.name || undefined);
  table.getColumn("code")?.setFilterValue(filters.code || undefined);
  table.getColumn("instructor")?.setFilterValue(filters.instructor || undefined);
  table.getColumn("school")?.setFilterValue(filters.school || undefined);
  table.getColumn("section")?.setFilterValue(filters.section || undefined);
  table.getColumn("startDate")?.setFilterValue(filters.startDate || undefined);
  table.getColumn("endDate")?.setFilterValue(filters.endDate || undefined);

  // Lowercase status for exact match
  const statusFilter = filters.status.map((s) => s.toLowerCase());
  table.getColumn("status")?.setFilterValue(
    statusFilter.length ? statusFilter : undefined
  );
};
</script>

<template>
  <div class="bg-white p-6 rounded-md shadow-md w-full max-w-full min-w-0 overflow-hidden">
    <!-- Top bar: label left, search & filter dialog right -->
    <div class="flex items-center justify-between py-4">
      <div class="text-md font-light text-black">All Classrooms List</div>

      <div class="flex items-center space-x-4">
        <!-- Classroom Filter Dialog -->
        <ClassroomFilterDialog @apply-filters="applyClassroomFilters" />

        <!-- Quick search by Name -->
        <Input
          class="max-w-sm bg-gray-100 text-gray-500 placeholder-gray-500 border-none rounded-full px-2 py-1 w-80"
          placeholder="Search by Class Name"
          :model-value="table.getColumn('name')?.getFilterValue() as string"
          @update:model-value="table.getColumn('name')?.setFilterValue($event)"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="border rounded-md overflow-x-auto">
      <Table class="w-full text-center font-normal text-gray-500">
        <TableHeader class="bg-blue-50">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-center font-semibold py-1 px-4"
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
              v-for="(row, idx) in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              :class="idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="text-center"
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
              <TableCell :colspan="columns.length" class="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-end py-4 space-x-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="!table.getCanPreviousPage()"
        @click="table.previousPage()"
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="!table.getCanNextPage()"
        @click="table.nextPage()"
      >
        Next
      </Button>
    </div>
  </div>
</template>
