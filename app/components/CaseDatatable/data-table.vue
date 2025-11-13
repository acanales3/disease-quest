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

import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { h, ref } from "vue";
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

</script>
<template>
  <div class="bg-white p-6 rounded-md w-full">
    <!-- Top bar: label left, search right -->
    <div class="flex flex-wrap items-center justify-between gap-4 py-4">
      <!-- Left: label -->
      <div class="text-lg font-semibold text-gray-900">Attempted Cases</div>

      <!-- Right: search input -->
      <div class="flex flex-wrap items-center gap-3">
        <div
          class="flex items-center justify-center w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <Icon name="lets-icons:filter" class="text-gray-600" />
        </div>
        <Input
          class="max-w-sm bg-gray-50 text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search by Subject"
          :model-value="table.getColumn('classroom')?.getFilterValue() as string"
          @update:model-value="table.getColumn('classroom')?.setFilterValue($event)"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <Table class="w-full text-center font-normal text-gray-600">
        <TableHeader class="bg-gray-50 border-b border-gray-200">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-center font-semibold text-gray-700 py-3 px-6"
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
              :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
              class="border-b border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="text-center py-4 px-6"
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
              <TableCell :colspan="columns.length" class="h-24 text-center text-gray-500">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between py-4">
      <div class="text-sm text-gray-500">
        Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
          class="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
          class="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>
