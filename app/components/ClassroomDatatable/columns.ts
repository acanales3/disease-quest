import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/ClassroomDatatable/data-table-dropdown.vue";
import { ArrowUpDown } from "lucide-vue-next";

export const columns: ColumnDef<Classroom>[] = [
  {
    accessorKey: "id",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "No"),
    cell: ({ row }) => {
      const id = row.getValue("id") as number;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        id.toString()
      );
    },
  },
  {
    accessorKey: "name",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Class Name"),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return h("div", { class: "text-center font-normal text-gray-600" }, name);
    },
  },
  {
    accessorKey: "code",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md transition-colors hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Code", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) => {
      const code = row.getValue("code") as string;
      return h(
        "div",
        { class: "uppercase text-center font-normal text-gray-600" },
        code
      );
    },
  },
  {
    accessorKey: "instructor",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Instructor"),
    cell: ({ row }) => {
      const instructor = row.getValue("instructor") as string;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        instructor
      );
    },
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
    accessorKey: "section",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Section"),
    cell: ({ row }) => {
      const section = row.getValue("section") as string;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        section
      );
    },
  },
  {
    accessorKey: "startDate",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Start Date"),
    cell: ({ row }) => {
      const startDate = row.getValue("startDate") as string;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        startDate
      );
    },
  },
  {
    accessorKey: "endDate",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "End Date"),
    cell: ({ row }) => {
      const endDate = row.getValue("startDate") as string;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        endDate
      );
    },
  },
  {
    accessorKey: "status",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as Classroom["status"];
      const isActive = status === "active";

      return h(
        "span",
        {
          class: `mx-auto px-2 py-1 rounded text-xs font-medium ${
            isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`,
        },
        isActive ? "Active" : "Inactive"
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const classroom = row.original;

      return h(
        "div",
        { class: "relative flex justify-center" },
        h(DropdownAction, { classroom })
      );
    },
  },
];

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
}
