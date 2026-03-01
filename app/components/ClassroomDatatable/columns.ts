import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/ClassroomDatatable/data-table-dropdown.vue";
import { ArrowUpDown } from "lucide-vue-next";

export interface Classroom {
  id: number;
  name: string;
  code: string;
  instructor: string;
  school: string;
  section: string;
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  invitationCode?: string | null;
}

export interface ColumnOptions {
  onEdit?: (classroom: Classroom) => void;
  onDelete?: (classroom: Classroom) => void;
}

export function getColumns(role: string, options?: ColumnOptions): ColumnDef<Classroom>[] {
  const columns: ColumnDef<Classroom>[] = [
  {
    accessorKey: "id",
    header: () => h("div", {}, "NO"),
    cell: ({ row }) =>
      h("div", { class: "text-gray-400 text-[13px]" }, row.getValue<number>("id").toString()),
  },
  {
    accessorKey: "name",
    header: () => h("div", {}, "CLASS NAME"),
    cell: ({ row }) =>
      h("div", { class: "font-medium text-gray-900 text-[13px]" }, row.getValue("name") as string),
  },
  {
    accessorKey: "code",
    header: ({ column }) =>
      h(
        "button",
        {
          class: "flex items-center gap-1 uppercase tracking-wider text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["CODE", h(ArrowUpDown, { class: "h-3 w-3" })]
      ),
    cell: ({ row }) =>
      h("div", { class: "uppercase text-[13px] text-gray-600 font-mono" }, row.getValue("code") as string),
  },
  {
    accessorKey: "instructor",
    header: () => h("div", {}, "INSTRUCTOR"),
    cell: ({ row }) =>
      h("div", { class: "text-[13px] text-gray-700" }, row.getValue("instructor") as string),
  },
  {
    accessorKey: "school",
    header: () => h("div", {}, "SCHOOL"),
    cell: ({ row }) =>
      h("div", { class: "text-[13px] text-gray-600" }, row.getValue("school") as string),
  },
  {
    accessorKey: "section",
    header: () => h("div", {}, "SECTION"),
    cell: ({ row }) =>
      h("div", { class: "text-[13px] text-gray-600" }, row.getValue("section") as string),
  },
  {
    accessorKey: "startDate",
    header: () => h("div", {}, "START DATE"),
    cell: ({ row }) =>
      h("div", { class: "text-[13px] text-gray-600" }, row.getValue("startDate") as string),
  },
  {
    accessorKey: "endDate",
    header: () => h("div", {}, "END DATE"),
    cell: ({ row }) =>
      h("div", { class: "text-[13px] text-gray-600" }, row.getValue("endDate") as string),
  },
  {
    accessorKey: "status",
    header: () => h("div", {}, "STATUS"),
    cell: ({ row }) => {
      const status = row.getValue("status") as Classroom["status"];
      const isActive = status === "active";
      return h(
        "span",
        {
          class: `inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          }`,
        },
        isActive ? "Active" : "Inactive"
      );
    },
  },
  ];

  // Include actions column for admin, instructor, and student roles
  if (role === 'admin' || role === 'instructor' || role === 'student') {
    columns.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const classroom = row.original;

        return h(
          "div",
          { class: "relative flex justify-center" },
          h(DropdownAction, { 
            classroom,
            role,
            onEdit: options?.onEdit,
            onDelete: options?.onDelete,
          })
        );
      },
    });
  }

  return columns;
}
