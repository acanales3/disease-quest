import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/InstructorDatatable/data-table-dropdown.vue";
import { ArrowUpDown } from "lucide-vue-next";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

export interface Instructor {
  id: string;
  name: string;
  email: string;
  school: string;
  classrooms: { id: number; name: string }[];
  status: "active" | "deactivated";
  isAdmin?: boolean;
}

// add handlers param so parent can pass callbacks (like delete)
export function getColumns(
  role: string,
  handlers?: { onDelete?: (instructor: Instructor) => void }
): ColumnDef<Instructor>[] {
  return [
    {
      id: "index",
      header: () => h("div", {}, "NO"),
      cell: ({ row }) => h("div", { class: "text-gray-500" }, String(row.index + 1)),
    },
    {
      accessorKey: "name",
      header: () => h("div", {}, "NAME"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const isAdmin = row.original.isAdmin;
        return h("div", { class: "font-medium text-gray-900" }, isAdmin ? `${name} (Admin)` : name);
      },
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
      cell: ({ row }) => h("div", { class: "lowercase text-gray-600" }, row.getValue("email")),
    },
    {
      accessorKey: "school",
      header: () => h("div", {}, "SCHOOL"),
      cell: ({ row }) => {
        const school = row.getValue("school") as string | undefined;
        return h("div", { class: "text-gray-600" }, school ?? "-");
      },
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
      accessorKey: "status",
      header: () => h("div", {}, "STATUS"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Instructor["status"];
        const isActive = status === "active";
        return h(
          "span",
          {
            class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm ${isActive
                ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                : "bg-gradient-to-r from-rose-600 to-red-700"
              }`,
          },
          isActive ? "Active" : "Deactivated"
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const instructor = row.original;
        return h("div", { class: "relative flex" }, h(DropdownAction, { instructor, role, onDelete: handlers?.onDelete }));
      },
    },
  ];
}
