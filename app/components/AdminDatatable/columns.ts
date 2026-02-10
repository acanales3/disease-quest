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
  classroom: number;
  status: "active" | "deactivated";
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
      accessorKey: "classroom",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Classroom"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          String(row.getValue("classroom") ?? "-")
        ),
    },
    {
      accessorKey: "status",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Administrator["status"];
        const isActive = status === "active";

        return h(
          "span",
          {
            class: `mx-auto px-2 py-1 rounded text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`,
          },
          isActive ? "Active" : "Deactivated"
        );
      },
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
