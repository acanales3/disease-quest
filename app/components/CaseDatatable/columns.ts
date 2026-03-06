import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { CaseDatatableDataTableDropdown as DropdownAction } from "#components";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Case {
  id: number | string;
  case_id?: number;
  name: string;
  description: string;
  classrooms: { id: number; name: string }[];
  completionDate: string;
  status: "not started" | "in progress" | "completed";
}

interface ColumnOptions {
  classroomId?: number;
  returnTo?: string;
  onEdit?: (caseData: Case) => void;
  onDelete?: (caseData: Case) => void;
  onRemoveFromClassroom?: (caseId: number) => void;
  onRemoveFromClassrooms?: (caseData: Case) => void;
  onRefresh?: () => void;
}

export function getColumns(
  role: string,
  options?: ColumnOptions,
): ColumnDef<Case>[] {
  return [
    {
      accessorKey: "id",
      header: () => h("div", {}, "NO"),
      cell: ({ row }) => {
        const original = row.original as Case;
        const dbId = original.case_id ?? original.id;
        return h(
          "div",
          { class: "text-[13px] text-gray-400 tabular-nums" },
          String(dbId),
        );
      },
    },
    {
      accessorKey: "name",
      header: () => h("div", {}, "NAME"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return h(
          "div",
          { class: "text-[13px] font-medium text-gray-900" },
          name,
        );
      },
    },
    {
      accessorKey: "description",
      header: () => h("div", {}, "DESCRIPTION"),
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return h("div", { class: "text-[13px] text-gray-600" }, description);
      },
    },
    {
      accessorKey: "classrooms",
      header: () => h("div", {}, "CLASSROOM"),
      cell: ({ row }) => {
        const classrooms = row.getValue("classrooms") as
          | { id: number; name: string }[]
          | undefined;

        if (!classrooms || classrooms.length === 0) {
          return h("div", { class: "text-[13px] text-gray-400" }, "-");
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
                          "text-[13px] cursor-pointer text-gray-600 hover:text-gray-900 transition",
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
      accessorKey: "status",
      header: () => h("div", {}, "STATUS"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Case["status"];

        const statusClasses = {
          "not started": "bg-red-50 text-red-600 border border-red-200",
          "in progress": "bg-blue-50 text-blue-600 border border-blue-200",
          completed: "bg-green-50 text-green-700 border border-green-200",
        };

        const statusText = {
          "not started": "Not Started",
          "in progress": "In Progress",
          completed: "Completed",
        };

        return h(
          "span",
          {
            class: `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusClasses[status]}`,
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
          { class: "relative flex justify-end" },
          h(DropdownAction, {
            caseData,
            role,
            classroomId: options?.classroomId,
            returnTo: options?.returnTo,
            onEdit: options?.onEdit,
            onDelete: options?.onDelete,
            onRemoveFromClassroom: options?.onRemoveFromClassroom,
            onRemoveFromClassrooms: options?.onRemoveFromClassrooms,
            onRefresh: options?.onRefresh,
          }),
        );
      },
    },
  ];
}
