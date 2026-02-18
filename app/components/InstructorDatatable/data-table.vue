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
  <div class="bg-white p-6 rounded-md shadow-md w-full max-w-full min-w-0 overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-between py-4">
      <div class="text-md font-light text-black">
        All {{ props.role === "instructor" ? "Instructors" : "Students" }} List
      </div>

      <div class="flex items-center space-x-4">
        <!-- Filters -->
        <FilterDialog :classrooms="props.classrooms || []" :role="props.role || 'student'" @apply-filters="handleApplyFilters" />

        <!-- Email search -->
        <Input
          class="max-w-sm bg-gray-100 text-gray-500 placeholder-gray-500 border-none rounded-full px-4 py-2 w-80"
          placeholder="Search by Email"
          :model-value="table.getColumn('email')?.getFilterValue() as string"
          @update:model-value="table.getColumn('email')?.setFilterValue($event)"
        />

        <!-- Column toggle -->
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
              @update:model-value="(value: boolean) => column.toggleVisibility(!!value)"
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
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" class="text-center font-semibold py-2 px-4">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow v-for="(row, idx) in table.getRowModel().rows" :key="row.id" :class="idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow>
              <TableCell :colspan="props.columns.length" class="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-end py-4 space-x-2">
      <Button variant="outline" size="sm" :disabled="!table.getCanPreviousPage()" @click="table.previousPage()">Previous</Button>
      <Button variant="outline" size="sm" :disabled="!table.getCanNextPage()" @click="table.nextPage()">Next</Button>
    </div>
  </div>
</template>
