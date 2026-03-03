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
import type { Classroom } from "../ClassroomDatatable/columns"; // Import Classroom type

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  classrooms?: Classroom[]; // Add classrooms prop
  hideClassroomFilter?: boolean;
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

  // Special handling for classroom filter which checks against the classrooms array
  if (columnId === "classroom" && (row.original as any).classrooms) {
    if (Array.isArray(filterValue)) {
      const classrooms = (row.original as any).classrooms;

      // `classrooms` is an array of objects like { id, name }.
      // Match by classroom id against the selected filter values.
      return classrooms.some((c: any) => {
        const classroomId =
          c && typeof c === "object" && "id" in c ? c.id : c;
        return filterValue.includes(String(classroomId));
      });
    }
  }

  // For array filters, check if cellValue is in the array
  if (Array.isArray(filterValue)) {
    // Convert cellValue to string for comparison
    return filterValue.includes(String(cellValue));
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

// Handle classroom dropdown selection
const selectedClassroom = ref<Classroom | null>(null);

const handleClassroomSelect = (classroom: Classroom | null) => {
  selectedClassroom.value = classroom;
  if (classroom) {
    table.getColumn("classroom")?.setFilterValue([String(classroom.id)]);
  } else {
    table.getColumn("classroom")?.setFilterValue(undefined);
  }
};
</script>
<template>
  <div class="bg-white rounded-xl border border-gray-200 w-full max-w-full min-w-0 overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <p class="text-sm font-medium text-gray-900">Records</p>

      <div class="flex items-center gap-2">
        <FilterDialog :classrooms="props.classrooms || []" @apply-filters="handleApplyFilters" />

        <div class="relative">
          <Icon name="lucide:search" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            class="h-8 pl-8 pr-3 text-sm w-56 border-gray-200 bg-white rounded-lg placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-[#4d1979]/30 focus-visible:border-[#4d1979]"
            placeholder="Search by email..."
            :model-value="table.getColumn('email')?.getFilterValue() as string"
            @update:model-value="table.getColumn('email')?.setFilterValue($event)"
          />
        </div>

        <DropdownMenu v-if="!hideClassroomFilter">
          <DropdownMenuTrigger as-child>
            <button class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {{ selectedClassroom ? selectedClassroom.name : "All Classes" }}
              <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="bg-white flex flex-col max-h-60 overflow-y-auto">
            <DropdownMenuItem class="cursor-pointer" @click="handleClassroomSelect(null)">All Classes</DropdownMenuItem>
            <DropdownMenuItem
              v-for="classroom in props.classrooms"
              :key="classroom.id"
              class="cursor-pointer"
              @click="handleClassroomSelect(classroom)"
            >
              {{ classroom.name }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-5 py-3.5 text-left text-gray-700"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
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
