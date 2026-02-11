import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { ArrowUpDown } from "lucide-vue-next";
import DropdownAction from "./data-table-dropdown.vue";

export interface Administrator {
  id: number; // row number (UI only)
  userId: string; // UUID for backend ops
  name: string;
  email: string;
  school: string;
}

export function getColumns(
  role: string,
  handlers?: {
    onDelete?: (admin: Administrator) => void;
  }
): ColumnDef<Administrator>[] {
  return [
    {
      accessorKey: "id",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "No"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          String(row.getValue("id") ?? "-")
        ),
    },
    {
      accessorKey: "name",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Name"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          row.getValue("name")
        ),
    },
    {
      accessorKey: "email",
      header: ({ column }) =>
        h(
          "button",
          {
            class:
              "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md transition-colors hover:bg-gray-200",
            onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          },
          ["Email", h(ArrowUpDown, { class: "h-4 w-4" })]
        ),
      cell: ({ row }) =>
        h(
          "div",
          { class: "lowercase text-center font-normal text-gray-600" },
          row.getValue("email")
        ),
    },
    {
      accessorKey: "school",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "School"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          row.getValue("school") ?? "-"
        ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) =>
        h(
          "div",
          { class: "relative flex justify-center" },
          h(DropdownAction as any, {
            admin: row.original,
            role,
            onDelete: handlers?.onDelete,
          })
        ),
    },
  ];
}
