<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/vue-table";

import {
  DropdownMenu,
  DropdownMenuItem,
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
import type { Classroom } from "../ClassroomDatatable/columns";

import { ChevronDown } from "lucide-vue-next";
import { ref, computed } from "vue";
import { valueUpdater } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

const selectedClassroom = ref<Classroom | null>(null);

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  classrooms?: Classroom[];
  hideClassroomFilter?: boolean;
  title?: string;
}>();

// Bubble the refresh event up to the page so it can re-fetch cases
const emit = defineEmits<{
  (e: "refresh"): void;
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

  if (columnId === "classrooms" && cellValue) {
    return (cellValue as { id: number; name: string }[]).some((c) =>
      filterValue.includes(String(c.id)),
    );
  }

  if (columnId === "status") {
    return filterValue.includes(cellValue);
  }

  return true;
};

const modifiedColumns = computed(() => {
  return props.columns.map((col: any) => {
    if (col.accessorKey === "status" || col.accessorKey === "classrooms") {
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
  table.getAllColumns().filter((column) => column.getCanHide())
);

const handleClassroomSelect = (classroom: Classroom | null) => {
  selectedClassroom.value = classroom;
  if (classroom) {
    table.getColumn("classrooms")?.setFilterValue([String(classroom.id)]);
  } else {
    table.getColumn("classrooms")?.setFilterValue(undefined);
  }
};
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl w-full max-w-full min-w-0 overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <p class="text-[13px] font-medium text-gray-900">
        {{ title || `${table.getFilteredRowModel().rows.length} record${table.getFilteredRowModel().rows.length === 1 ? "" : "s"}` }}
      </p>

      <div class="flex items-center gap-2">
        <div class="relative">
          <Icon name="lucide:search" size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            class="pl-8 h-8 text-[13px] w-56 border-gray-200 rounded-lg placeholder:text-gray-400 focus-visible:ring-[#4d1979]/30"
            placeholder="Search by case name..."
            :model-value="table.getColumn('name')?.getFilterValue() as string"
            @update:model-value="table.getColumn('name')?.setFilterValue($event)"
          />
        </div>

        <DropdownMenu v-if="!hideClassroomFilter">
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="h-8 px-3 text-[13px] border-gray-200 text-gray-600 font-normal gap-1.5 min-w-[130px] justify-between">
              <span class="truncate">{{ selectedClassroom ? selectedClassroom.name : "All Classes" }}</span>
              <ChevronDown class="w-3.5 h-3.5 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="max-h-60 overflow-y-auto">
            <DropdownMenuItem @click="handleClassroomSelect(null)">
              All Classes
            </DropdownMenuItem>
            <DropdownMenuItem v-if="!classrooms?.length" disabled>
              No Classes Available
            </DropdownMenuItem>
            <DropdownMenuItem
              v-else
              v-for="c in classrooms"
              :key="c.id"
              class="whitespace-nowrap"
              @click="handleClassroomSelect(c)"
            >
              {{ c.name }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="h-8 px-3 text-[13px] border-gray-200 text-gray-600 font-normal gap-1.5">
              Columns
              <ChevronDown class="w-3.5 h-3.5" />
            </Button>
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

    <div class="overflow-x-auto">
      <Table class="w-full">
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="border-b border-gray-100 hover:bg-transparent"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 bg-gray-50/60"
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
                class="px-4 py-3 text-left text-[13px] text-gray-700"
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
              <TableCell :colspan="columns.length" class="h-24 text-center text-[13px] text-gray-400">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between px-5 py-4 border-t border-gray-100">
      <p class="text-[12px] text-gray-400">
        Showing {{ table.getRowModel().rows.length }} of {{ table.getFilteredRowModel().rows.length }} records
      </p>
      <div class="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          class="h-8 px-3 text-[13px] border-gray-200 text-gray-600 gap-1"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <Icon name="lucide:chevron-left" size="13" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 px-3 text-[13px] border-gray-200 text-gray-600 gap-1"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          Next <Icon name="lucide:chevron-right" size="13" />
        </Button>
      </div>
    </div>
  </div>
</template>
