import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/StudentDatatable/data-table-dropdown.vue";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";
import type { Classroom } from "../ClassroomDatatable/columns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

export interface Student {
  id: number;

  // UUID from Supabase: students.user_id (FK - users.id).
  // Using numeric id for datatable display; userId" for API operations.
  userId?: string;
  name: string;
  nickname?: string;
  email: string;
  school: string;
  msyear: number;
  classroom: number;
  classrooms?: number[];
  status: "registered" | "unregistered";
  // action column still needed
}

export interface ColumnOptions {
  onDelete?: (student: Student) => void;
  onRemoveFromClassroom?: (student: Student) => void;
  classrooms?: Classroom[];
}

export function getColumns(role: string, options?: ColumnOptions): ColumnDef<Student>[] {
  const classroomsMap = new Map((options?.classrooms || []).map(c => [c.id, c.name]));

  return [
    {
      accessorKey: "id",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "No"),
      cell: ({ row }) => {
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          (row.index + 1).toString()
        );
      },
    },
    {
      accessorKey: "name",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Name"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return h("div", { class: "text-center font-normal text-gray-600" }, name);
      },
    },
    {
      accessorKey: "email",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Email"),
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
      cell: ({ row }) => {
        const school = row.getValue("school") as string;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          school
        );
      },
    },
    {
      accessorKey: "classroom",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Classroom"),
      cell: ({ row }) => {
        const student = row.original;

        // Get all classroom IDs for this student
        const classroomIds = student.classrooms && student.classrooms.length > 0
          ? student.classrooms
          : student.classroom && student.classroom !== 0
            ? [student.classroom]
            : []

        // Map to names
        const roomNames = (student.classrooms || []).map(c => c.name || String(c.id));

        if (!roomNames || roomNames.length === 0) {
          return h(
            "div",
            { class: "text-center font-normal text-gray-600" },
            "-"
          );
        }

        const first = roomNames[0] || "";
        // Truncate if long or if there are multiple
        const text = roomNames.length > 1 || first.length > 20
          ? (first.length > 20 ? first.slice(0, 20) + '...' : first) + (roomNames.length > 1 ? '...' : '')
          : first;

        const needsTooltip = roomNames.length > 1 || first.length > 20;

        if (!needsTooltip) {
          return h(
            "div",
            { class: "text-center font-normal text-gray-600" },
            text
          );
        }

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
                      text
                    ),
                }
              ),

              h(
                TooltipContent,
                { side: "bottom", class: "bg-white shadow-md max-w-xs" },
                {
                  default: () => roomNames.map(name =>
                    h("div", { class: "text-sm text-gray-600 py-0.5" }, name)
                  )
                }
              ),
            ],
          }
        );
      },
    },
    {
      accessorKey: "msyear",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "MS-Year"),
      cell: ({ row }) => {
        const msyear = row.getValue("msyear") as number | null;
        return h(
          "div",
          { class: "text-center font-normal text-gray-600" },
          msyear ? msyear.toString() : ""
        );
      },
    },
    {
      accessorKey: "status",
      header: () =>
        h("div", { class: "text-center font-normal text-black" }, "Status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as Student["status"];
        const isActive = status === "registered";

        return h(
          "span",
          {
            class: `mx-auto px-2 py-1 rounded text-xs font-medium ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`,
          },
          isActive ? "Registered" : "Unregistered"
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
          { class: "relative flex justify-center" },
          h(DropdownAction, {
            student,
            role,
            onDelete: options?.onDelete,
            onRemoveFromClassroom: options?.onRemoveFromClassroom,
          })
        );
      },
    },
  ];
}
