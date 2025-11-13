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
  classrooms: { id: number; name: string }[];
}>();

const emit = defineEmits<{
  (e: "classroom-selected", classroomId: number): void; // emits when a classroom is selected in the dropdown menu of the data table
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

onMounted(() => {
  props.columns.forEach((col) => {
    const key = (col.id ?? (col as any).accessorKey) as string;
    if ((col as any).meta?.hidden) {
      table.getColumn(key)?.toggleVisibility(false);
    }
  });
});

const hideableColumns = computed(() =>
  table.getAllColumns().filter((column) => column.getCanHide())
);

</script>
<template>
  <div class="bg-white p-6 rounded-md shadow-md w-full">
    <!-- Top bar: label left, search & column menu right -->
    <div class="flex items-center justify-between py-4">
      <!-- Left: label -->
      <div class="text-md font-light text-black">Classroom Leaderboard</div>

      <!-- Right: dropdown to select classroom -->
      <div class="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              class="bg-gray-100 text-gray-500 hover:bg-gray-200 flex justify-between items-center px-4 py-2 rounded-md"
            >
              Classrooms
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            class="bg-white rounded-md shadow-md flex flex-col"
          >
            <DropdownMenuItem
              v-for="classroom in classrooms"
              :key="classroom.id"
              class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md block"
              @click="emit('classroom-selected', classroom.id)"
            >
              {{ classroom.name }}
            </DropdownMenuItem>
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
              <!-- Table cell styling adjusted to match the design of other tables (Might need to change later)-->
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="text-center py-3 leading-6 align-middle"
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
