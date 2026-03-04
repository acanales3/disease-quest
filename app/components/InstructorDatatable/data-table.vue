<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/vue-table";
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

import type { Classroom } from "../ClassroomDatatable/columns";

/* ---------------- PROPS ---------------- */
const props = defineProps<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  classrooms?: Classroom[];
  role?: "student" | "instructor"; // optional role to handle status filter
}>();

/* ---------------- TABLE STATE ---------------- */
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({});

/* ---------------- FILTER FUNCTION ---------------- */
// Handles array-based filters for status and classrooms
const arrayFilterFn = (row: any, columnId: string, filterValue: any) => {
  if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;

  const cellValue = row.getValue(columnId);

  if (columnId === "classrooms") {
    // cellValue is array of objects {id, name}
    if (!cellValue) return false;
    return (cellValue as { id: number; name: string }[]).some(c =>
      filterValue.includes(String(c.id))
    );
  }

  if (columnId === "status") {
    return filterValue.includes(cellValue);
  }

  return true;
};

/* ---------------- MODIFY COLUMNS ---------------- */
const modifiedColumns = computed(() => {
  return props.columns.map((col: any) => {
    if (col.accessorKey === "status" || col.accessorKey === "classrooms") {
      return { ...col, filterFn: arrayFilterFn };
    }
    return col;
  });
});

/* ---------------- TABLE SETUP ---------------- */
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
  getFilteredRowModel: getFilteredRowModel(),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnVisibilityChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnVisibility),
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

/* ---------------- COLUMN VISIBILITY ---------------- */
const hideableColumns = computed(() =>
  table.getAllColumns().filter((column) => column.getCanHide())
);

/* ---------------- HANDLE FILTER APPLICATION ---------------- */
const handleApplyFilters = (filters: any) => {
  // string filters
  table.getColumn("name")?.setFilterValue(filters.name || undefined);
  table.getColumn("email")?.setFilterValue(filters.email || undefined);
  table.getColumn("school")?.setFilterValue(filters.school || undefined);

  // classrooms: send IDs as strings
  table.getColumn("classrooms")?.setFilterValue(
    filters.classroom?.length ? filters.classroom.map(String) : undefined
  );

  // status: handle instructors vs students
  const validStatuses =
    props.role === "instructor"
      ? ["active", "deactivated"]
      : ["registered", "unregistered"];

  const filteredStatus =
    filters.status?.length
      ? filters.status.filter((s: string) => validStatuses.includes(s))
      : undefined;

  table.getColumn("status")?.setFilterValue(filteredStatus);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 w-full max-w-full min-w-0 overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <p class="text-sm font-medium text-gray-900">Records</p>

      <div class="flex items-center gap-2">
        <FilterDialog :classrooms="props.classrooms || []" :role="props.role || 'student'" :show-msyear="false" @apply-filters="handleApplyFilters" />

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
              @update:model-value="(value: boolean) => column.toggleVisibility(!!value)"
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
              <TableCell :colspan="props.columns.length" class="h-32 text-center text-sm text-gray-400">
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
