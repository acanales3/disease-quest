<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/vue-table"

import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable,
} from "@tanstack/vue-table"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { ref, onMounted, computed } from "vue"
import { valueUpdater } from "@/lib/utils"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

import { ChevronDown } from "lucide-vue-next"

import ClassroomFilterDialog from "../ClassroomFilterDialog/ClassroomFilterDialog.vue"


/* ---------------------------------------------
TYPE GUARD (fix accessorKey TS error)
--------------------------------------------- */
function hasAccessorKey<TData, TValue>(
  col: ColumnDef<TData, TValue>
): col is ColumnDef<TData, TValue> & { accessorKey: string } {
  return "accessorKey" in col
}


/* ---------------------------------------------
PROPS
--------------------------------------------- */
const props = withDefaults(
  defineProps<{
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    rowLength?: number
    userRole: "admin" | "instructor" | "student"
  }>(),
  { rowLength: 10 }
)


/* ---------------------------------------------
STATE
--------------------------------------------- */
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})


/* ---------------------------------------------
CREATE TABLE
--------------------------------------------- */
const table = useVueTable({
  get data() {
    return props.data
  },

  get columns() {
    return props.columns.map((col) => {
      const isStatusColumn =
        col.id === "status" ||
        (hasAccessorKey(col) && col.accessorKey === "status")

      if (isStatusColumn) {
        return {
          ...col,
          filterFn: (row, columnId, filterValues: string[]) => {
            const cellValue = String(row.getValue(columnId) ?? "").toLowerCase()
            if (!filterValues?.length) return true
            return filterValues.includes(cellValue)
          },
        } as ColumnDef<TData, TValue>
      }

      return col
    })
  },

  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),

  onColumnFiltersChange: (v) => valueUpdater(v, columnFilters),
  onSortingChange: (v) => valueUpdater(v, sorting),
  onColumnVisibilityChange: (v) => valueUpdater(v, columnVisibility),

  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
  },

  initialState: {
    pagination: {
      pageSize: props.rowLength,
      pageIndex: 0,
    },
  },
})


/* ---------------------------------------------
HIDEABLE COLUMNS (for Columns dropdown)
--------------------------------------------- */
const hideableColumns = computed(() =>
  table.getAllColumns().filter((column) => column.getCanHide())
)


/* ---------------------------------------------
INITIAL COLUMN VISIBILITY
--------------------------------------------- */
onMounted(() => {
  props.columns.forEach((col) => {
    const key =
      col.id ?? (hasAccessorKey(col) ? col.accessorKey : undefined)

    if (!key) return

    if ((col as any).meta?.hidden) {
      table.getColumn(key)?.toggleVisibility(false)
    }
  })
})


/* ---------------------------------------------
SAFE SEARCH MODEL VALUE
--------------------------------------------- */
const getNameFilterValue = () => {
  const value = table.getColumn("name")?.getFilterValue()
  return typeof value === "string" ? value : ""
}

const setNameFilterValue = (value: string | number) => {
  table.getColumn("name")?.setFilterValue(String(value))
}


/* ---------------------------------------------
APPLY FILTERS FROM FILTER DIALOG
--------------------------------------------- */
const applyClassroomFilters = (filters: {
  name: string
  code: string
  instructor: string
  school: string
  section: string
  startDate: string
  endDate: string
  status: string[]
}) => {
  table.getColumn("name")?.setFilterValue(filters.name || undefined)
  table.getColumn("code")?.setFilterValue(filters.code || undefined)
  table.getColumn("instructor")?.setFilterValue(filters.instructor || undefined)
  table.getColumn("school")?.setFilterValue(filters.school || undefined)
  table.getColumn("section")?.setFilterValue(filters.section || undefined)
  table.getColumn("startDate")?.setFilterValue(filters.startDate || undefined)
  table.getColumn("endDate")?.setFilterValue(filters.endDate || undefined)

  const statusFilter = filters.status.map((s) => s.toLowerCase())

  table.getColumn("status")?.setFilterValue(
    statusFilter.length ? statusFilter : undefined
  )
}
</script>


<template>
  <div class="bg-white border border-gray-200 rounded-xl w-full max-w-full overflow-hidden">

    <!-- Top Bar -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <p class="text-[13px] font-medium text-gray-900">
        {{ table.getFilteredRowModel().rows.length }} record{{ table.getFilteredRowModel().rows.length === 1 ? '' : 's' }}
      </p>

      <div class="flex items-center gap-2">
        <ClassroomFilterDialog
          :user-role="props.userRole"
          @apply-filters="applyClassroomFilters"
        />

        <div class="relative">
          <Icon name="lucide:search" size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            class="pl-8 h-8 text-[13px] w-56 border-gray-200 rounded-lg placeholder:text-gray-400 focus-visible:ring-[#4d1979]/30"
            placeholder="Search by class name..."
            :model-value="getNameFilterValue()"
            @update:model-value="setNameFilterValue"
          />
        </div>

        <!-- Columns Dropdown -->
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

    <!-- Table -->
    <div class="overflow-x-auto">
      <Table class="w-full">
        <TableHeader>
          <TableRow class="border-b border-gray-100 hover:bg-transparent">
            <TableHead
              v-for="header in table.getHeaderGroups()[0].headers"
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
          <template v-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
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
              <TableCell :colspan="props.columns.length" class="h-24 text-center text-[13px] text-gray-400">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
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