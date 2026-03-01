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
        h("div", {}, "NO"),
      cell: ({ row }) =>
        h(
          "div",
          {},
          String(row.getValue("id") ?? "-")
        ),
    },
    {
      accessorKey: "name",
      header: () =>
        h("div", {}, "NAME"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "capitalize" },
          row.getValue("name")
        ),
    },
    {
      accessorKey: "email",
      header: ({ column }) =>
        h(
          "button",
          {
            class: "flex items-center gap-1",
            onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
          },
          ["EMAIL", h(ArrowUpDown, { class: "h-3.5 w-3.5" })]
        ),
      cell: ({ row }) =>
        h(
          "div",
          { class: "lowercase" },
          row.getValue("email")
        ),
    },
    {
      accessorKey: "school",
      header: () =>
        h("div", {}, "SCHOOL"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "capitalize" },
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
