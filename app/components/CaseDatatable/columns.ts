import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/CaseDatatable/data-table-dropdown.vue";
import { ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Case {
  id: number;
  name: string;
  description: string;
  classrooms: { id: number; name: string }[];
  completionDate: string;
  status: "not started" | "in progress" | "completed";
}

export function getColumns(
  role: string,
  onRefresh: () => void,
): ColumnDef<Case>[] {
  return [
    {
      accessorKey: "id",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "No"),
      cell: ({ row }) => {
        const id = row.getValue("id") as number;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          id.toString(),
        );
      },
    },
    {
      accessorKey: "name",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Name"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          name,
        );
      },
    },
    {
      accessorKey: "description",
      header: () =>
        h(
          "div",
          { class: "text-center font-normal text-black" },
          "Description",
        ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          description,
        );
      },
    },
    {
      accessorKey: "classrooms",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Classroom"),
      cell: ({ row }) => {
        const classrooms = row.getValue("classrooms") as
          | { id: number; name: string }[]
          | undefined;

        if (!classrooms || classrooms.length === 0) {
          return h("div", { class: "text-center text-gray-600" }, "-");
        }

        const first = classrooms[0]?.name ?? "-";
        const truncated =
          first.length > 10 || classrooms.length > 1
            ? first.slice(0, 10) + "..."
            : first;

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
                        class:
                          "text-center cursor-pointer text-gray-600 hover:text-gray-900 transition",
                      },
                      truncated,
                    ),
                },
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
                        c.name,
                      ),
                    ),
                },
              ),
            ],
          },
        );
      },
    },
    {
      accessorKey: "completionDate",
      header: () =>
        h(
          "div",
          { class: "text-center font-normal text-black" },
          "Completion Date",
        ),
      cell: ({ row }) => {
        const completionDate = row.getValue("completionDate") as string;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          completionDate,
        );
      },
    },
    {
      accessorKey: "status",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Case["status"];

        const statusClasses = {
          "not started": "bg-gray-100 text-red-700",
          "in progress": "bg-gray-100 text-blue-700",
          completed: "bg-gray-100 text-green-700",
        };

        const statusText = {
          "not started": "Not Started",
          "in progress": "In Progress",
          completed: "Completed",
        };

        return h(
          "span",
          {
            class: `mx-auto px-2 py-1 rounded text-xs font-medium ${statusClasses[status]}`,
          },
          statusText[status],
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const caseData = row.original;

        return h(
          "div",
          { class: "relative flex justify-center" },
          h(DropdownAction, {
            caseData,
            role,
            onRefresh, // wire the refresh callback into the dropdown
          }),
        );
      },
    },
  ];
}
