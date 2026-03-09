import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { ArrowUpDown } from "lucide-vue-next";
import DropdownAction from "./data-table-dropdown.vue";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

export interface Administrator {
  id: number; // row number (UI only)
  userId: string; // UUID for backend ops
  name: string;
  email: string;
  school: string;
  classrooms: { id: number; name: string }[];
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
      accessorKey: "classrooms",
      header: () => h("div", {}, "CLASSROOM"),
      cell: ({ row }) => {
        const classrooms = row.getValue("classrooms") as { id: number; name: string }[] | undefined;

        if (!classrooms || classrooms.length === 0) {
          return h("div", { class: "text-gray-400" }, "-");
        }

        const first = classrooms[0]?.name ?? "-";
        const truncated = first.length > 10 || classrooms.length > 1 ? first.slice(0, 10) + "..." : first;

        return h(
          Tooltip,
          {},
          {
            default: () => [
              h(TooltipTrigger, { asChild: true }, {
                default: () => h("div", { class: "cursor-pointer text-gray-600 hover:text-gray-900 transition" }, truncated),
              }),
              h(TooltipContent, { side: "bottom", class: "bg-white shadow-md w-56" }, {
                default: () => classrooms.map((c) => h("div", { key: c.id, class: "py-1 text-sm text-gray-600" }, c.name)),
              }),
            ],
          }
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
