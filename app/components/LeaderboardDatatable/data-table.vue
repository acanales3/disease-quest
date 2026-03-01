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
  selectedClassroomId?: number;
}>();

const emit = defineEmits<{
  (e: "classroom-selected", classroomId: number): void; // emits when a classroom is selected in the dropdown menu of the data table
}>();

const selectedClassroomName = computed(() => {
    const selected = props.classrooms.find(c => c.id === props.selectedClassroomId);
    return selected ? selected.name : "Classrooms";
});

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
  <div class="bg-white rounded-xl border border-gray-200 w-full overflow-hidden">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <p class="text-sm font-medium text-gray-900">All Rankings</p>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            {{ selectedClassroomName }}
            <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="bg-white flex flex-col max-h-60 overflow-y-auto">
          <DropdownMenuItem
            v-for="classroom in classrooms"
            :key="classroom.id"
            class="cursor-pointer"
            @click="emit('classroom-selected', classroom.id)"
          >
            {{ classroom.name }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
