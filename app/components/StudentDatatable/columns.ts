import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/StudentDatatable/data-table-dropdown.vue";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import type { Classroom } from "../ClassroomDatatable/columns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Student {
  id: number;
  userId?: string;
  name: string;
  nickname?: string;
  email: string;
  school: string;
  msyear: number;
  classroom: number;
  classrooms?: number[];
  status: "registered" | "unregistered";
}

export interface ColumnOptions {
  onDelete?: (student: Student) => void;
  onRemoveFromClassroom?: (student: Student) => void;
  classrooms?: Classroom[];
  hideClassroomColumn?: boolean;
}

export function getColumns(
  role: string,
  options?: ColumnOptions,
): ColumnDef<Student>[] {
  const classroomsMap = new Map(
    (options?.classrooms || []).map((c) => [c.id, c.name]),
  );

  const allColumns: ColumnDef<Student>[] = [
    {
      accessorKey: "id",
      header: () => h("div", {}, "NO"),
      cell: ({ row }) =>
        h("div", { class: "text-gray-500" }, (row.index + 1).toString()),
    },
    {
      accessorKey: "name",
      header: () => h("div", {}, "NAME"),
      cell: ({ row }) =>
        h(
          "div",
          { class: "font-medium text-gray-900" },
          row.getValue("name") as string,
        ),
    },
    {
      accessorKey: "email",
      header: () => h("div", {}, "EMAIL"),
      cell: ({ row }) =>
        h("div", { class: "lowercase text-gray-600" }, row.getValue("email")),
    },
    {
      accessorKey: "school",
      header: () => h("div", {}, "SCHOOL"),
      cell: ({ row }) =>
        h("div", { class: "text-gray-600" }, row.getValue("school") as string),
    },
    {
      accessorKey: "classroom",
      header: () => h("div", {}, "CLASSROOM"),
      cell: ({ row }) => {
        const student = row.original;
        const roomNames = (student.classrooms || []).map(
          (c: any) => c.name || String(c.id),
        );

        if (!roomNames || roomNames.length === 0) {
          return h("div", { class: "text-gray-400" }, "-");
        }

        const first = roomNames[0] || "";
        const text =
          roomNames.length > 1 || first.length > 20
            ? (first.length > 20 ? first.slice(0, 20) + "..." : first) +
              (roomNames.length > 1 ? "..." : "")
            : first;
        const needsTooltip = roomNames.length > 1 || first.length > 20;

        if (!needsTooltip) return h("div", { class: "text-gray-600" }, text);

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
                          "cursor-pointer text-gray-600 hover:text-gray-900 transition",
                      },
                      text,
                    ),
                },
              ),
              h(
                TooltipContent,
                { side: "bottom", class: "bg-white shadow-md max-w-xs" },
                {
                  default: () =>
                    roomNames.map((name: string) =>
                      h("div", { class: "text-sm text-gray-600 py-0.5" }, name),
                    ),
                },
              ),
            ],
          },
        );
      },
    },
    {
      accessorKey: "msyear",
      header: () => h("div", {}, "MS-YEAR"),
      cell: ({ row }) => {
        const msyear = row.getValue("msyear") as number | null;
        return h(
          "div",
          { class: "text-gray-600" },
          msyear ? msyear.toString() : "-",
        );
      },
    },
    {
      accessorKey: "status",
      header: () => h("div", {}, "STATUS"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Student["status"];
        const isActive = status === "registered";
        return h(
          "span",
          {
            class: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm ${
              isActive
                ? "bg-gradient-to-r from-emerald-600 to-teal-700"
                : "bg-gradient-to-r from-rose-600 to-red-700"
            }`,
          },
          isActive ? "Registered" : "Unregistered",
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original;
        return h(
          "div",
          { class: "relative flex" },
          h(DropdownAction, {
            student,
            role,
            onDelete: options?.onDelete,
            onRemoveFromClassroom: options?.onRemoveFromClassroom,
          }),
        );
      },
    },
  ];

  return options?.hideClassroomColumn
    ? allColumns.filter((col: any) => col.accessorKey !== "classroom")
    : allColumns;
}
