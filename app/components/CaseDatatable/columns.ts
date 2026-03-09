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
  classroom_id?: number; // per-row classroom context (students only)
  name: string;
  description: string;
  classrooms: { id: number; name: string }[];
  completionDate: string;
  status: "not started" | "in progress" | "completed";
  sessionId?: string | null;
}

interface ColumnOptions {
  classroomId?: number; // kept for admin/instructor classroom pages
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
          "not started": "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-sm",
          "in progress": "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-sm",
          completed: "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm",
        };

        const statusText = {
          "not started": "Not Started",
          "in progress": "In Progress",
          completed: "Completed",
        };

        return h(
          "span",
          {
            class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusClasses[status]}`,
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

        // For students: classroomId comes from the row itself (each row is a
        // unique case+classroom pair). For admin/instructor classroom pages:
        // falls back to the global options.classroomId as before.
        const resolvedClassroomId =
          caseData.classroom_id ?? options?.classroomId;

        return h(
          "div",
          { class: "relative flex justify-end" },
          h(DropdownAction, {
            caseData,
            role,
            classroomId: resolvedClassroomId,
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