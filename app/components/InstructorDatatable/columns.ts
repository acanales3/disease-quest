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
}

// add handlers param so parent can pass callbacks (like delete)
export function getColumns(
  role: string,
  handlers?: { onDelete?: (instructor: Instructor) => void }
): ColumnDef<Instructor>[] {
  return [
    {
      id: "index",
      header: () => h("div", { class: "text-center font-normal text-black" }, "No"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          String(row.index + 1)
        ),
    },
    {
      accessorKey: "name",
      header: () => h("div", { class: "text-center font-normal text-black" }, "Name"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return h("div", { class: "text-center font-normal text-gray-600" }, name);
      },
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
      header: () => h("div", { class: "text-center font-normal text-black" }, "School"),
      cell: ({ row }) => {
        const school = row.getValue("school") as string | undefined;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          school ?? "-"
        );
      },
    },
    {
      accessorKey: "classrooms",
      header: () => h("div", { class: "text-center font-normal text-black" }, "Classroom"),
      cell: ({ row }) => {
        const classrooms = row.getValue("classrooms") as { id: number; name: string }[] | undefined;

        if (!classrooms || classrooms.length === 0) {
          return h("div", { class: "text-center text-gray-600" }, "-");
        }

        const first = classrooms[0]?.name ?? "-";
        const truncated = first.length > 10 || classrooms.length > 1 ? first.slice(0, 10) + "..." : first;

        return h(
          Tooltip,
          {},
          {
            default: () => [
              h(
                TooltipTrigger,
                { asChild: true },
                {
                  default: () =>
                    h(
                      "div",
                      {
                        class: "text-center cursor-pointer text-gray-600 hover:text-gray-900 transition",
                      },
                      truncated
                    ),
                }
              ),
              h(
                TooltipContent,
                { side: "bottom", class: "bg-white shadow-md w-56" },
                {
                  default: () =>
                    classrooms.map((c) =>
                      h(
                        "div",
                        { key: c.id, class: "py-1 text-sm text-gray-600" },
                        c.name
                      )
                    ),
                }
              ),
            ],
          }
        );
      },
    },
    {
      accessorKey: "status",
      header: () => h("div", { class: "text-center font-normal text-black" }, "Status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Instructor["status"];
        const isActive = status === "active";

        return h(
          "span",
          {
            class: `mx-auto px-2 py-1 rounded text-xs font-medium ${
              isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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

        return h(
          "div",
          { class: "relative flex justify-center" },
          h(DropdownAction, {
            instructor,
            role,
            onDelete: handlers?.onDelete, // forward callback into dropdown
          })
        );
      },
    },
  ];
}
