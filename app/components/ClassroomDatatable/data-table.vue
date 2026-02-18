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
import { ref, onMounted } from "vue"
import { valueUpdater } from "@/lib/utils"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"

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
  <div class="bg-white p-6 rounded-md shadow-md w-full max-w-full overflow-hidden">

    <!-- Top Bar -->
    <div class="flex items-center justify-between py-4">
      <div class="text-md font-light text-black">
        All Classrooms List
      </div>

      <div class="flex items-center space-x-4">

        <ClassroomFilterDialog
          :user-role="props.userRole"
          @apply-filters="applyClassroomFilters"
        />

        <Input
          class="max-w-sm bg-gray-100 text-gray-500 placeholder-gray-500 border-none rounded-full px-2 py-1 w-80"
          placeholder="Search by Class Name"
          :model-value="getNameFilterValue()"
          @update:model-value="setNameFilterValue"
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
          <template v-if="table.getRowModel().rows.length">
            <TableRow
              v-for="(row, idx) in table.getRowModel().rows"
              :key="row.id"
              :class="idx % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'"
            >
              <!-- ROW HEIGHT FIX -->
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="py-3 text-center"
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
