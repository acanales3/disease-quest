<script setup lang="ts" generic="TData, TValue">
import type {
  Column,
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
  DropdownMenuItem,
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

import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { computed, h, ref } from "vue";
import { valueUpdater } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import FilterDialog from "@/components/FilterDialog/FilterDialog.vue";

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  classrooms: { id: number; name: string}[];
}>();

const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});

// Custom filter function for array-based filters
const arrayFilterFn = (row: any, columnId: string, filterValue: any) => {
  if (
    !filterValue ||
    (Array.isArray(filterValue) && filterValue.length === 0)
  ) {
    return true;
  }

  const cellValue = row.getValue(columnId);

  // For array filters, check if cellValue is in the array
  if (Array.isArray(filterValue)) {
    // Convert cellValue to string for comparison
    return filterValue.includes(cellValue);
  }

  // Fallback for non-array filters (shouldn't happen with this function)
  return true;
};

// Modify columns to add filterFn for status, msyear, and classroom
const modifiedColumns = computed(() => {
  return props.columns.map((col: any) => {
    // Add array filter function to status, msyear, and classroom columns
    if (
      col.accessorKey === "status" ||
      col.accessorKey === "msyear" ||
      col.accessorKey === "classroom"
    ) {
      return {
        ...col,
        filterFn: arrayFilterFn,
      };
    }
    return col;
  });
});

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return modifiedColumns.value;
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
  table.getAllColumns().filter((column) => column.getCanHide()),
);

// Handle filter application
const handleApplyFilters = (filters: any) => {
  // Apply string filters
  table.getColumn("name")?.setFilterValue(filters.name || undefined);
  table.getColumn("email")?.setFilterValue(filters.email || undefined);
  table.getColumn("school")?.setFilterValue(filters.school || undefined);

  // Apply array filters
  table
    .getColumn("msyear")
    ?.setFilterValue(
      filters.msyear && filters.msyear.length > 0 ? filters.msyear : undefined,
    );

  table
    .getColumn("classroom")
    ?.setFilterValue(
      filters.classroom && filters.classroom.length > 0
        ? filters.classroom
        : undefined,
    );

  table
    .getColumn("status")
    ?.setFilterValue(
      filters.status && filters.status.length > 0 ? filters.status : undefined,
    );
};

const selectedClassroom = computed(() => {
  const filter = table.getColumn('classroom')?.getFilterValue() as number[] | undefined
  if (!filter?.length) return 'All Classes'

  const found = props.classrooms.find(c => c.id === filter[0])
  return found?.name ?? 'All Classes'
})
</script>
<template>
  <div
    class="bg-white p-6 rounded-md shadow-md w-full max-w-full min-w-0 overflow-hidden"
  >
    <!-- Top bar: label left, search & column menu right -->
    <div class="flex items-center justify-between py-4">
      <!-- Left: label -->
      <div class="text-md font-light text-black">All Students List</div>

      <!-- Right: search input + dropdowns -->
      <div class="flex items-center space-x-4">
        <!-- Filter Dialog component -->
        <FilterDialog @apply-filters="handleApplyFilters" />

        <Input
          class="max-w-sm bg-gray-100 text-gray-500 placeholder-gray-500 border-none rounded-full px-4 py-2 w-80"
          placeholder="Search by Email"
          :model-value="table.getColumn('email')?.getFilterValue() as string"
          @update:model-value="table.getColumn('email')?.setFilterValue($event)"
        />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              class="bg-gray-100 text-gray-500 hover:bg-gray-200 flex justify-between items-center px-4 py-2 rounded-md"
            >
              {{  selectedClassroom }}
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="bg-white rounded-md shadow-md flex flex-col"
          >
            <DropdownMenuItem
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
              @click="table.getColumn('classroom')?.setFilterValue(undefined)"
            >All Classes</DropdownMenuItem>
            <DropdownMenuItem
              v-for="classroom in props.classrooms"
              :key="classroom.id"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
              @click="table.getColumn('classroom')?.setFilterValue([classroom.id])"
            >
            {{ classroom.name }}
          </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button class="bg-gray-100 text-gray-500 hover:bg-gray-200">
              Columns
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              v-for="column in hideableColumns"
              :key="column.id"
              class="capitalize"
              :modelValue="column.getIsVisible()"
              @update:modelValue="
                (value: boolean) => column.toggleVisibility(!!value)
              "
            >
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
              class="text-center font-semibold py-2 px-4"
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
