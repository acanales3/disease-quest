import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/StudentDatatable/data-table-dropdown.vue";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";

export const columns: ColumnDef<Student>[] = [
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
      const room = row.getValue("classroom") as number;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        room.toString()
      );
    },
  },
  {
    accessorKey: "msyear",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "MS-Year"),
    cell: ({ row }) => {
      const msyear = row.getValue("msyear") as number;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        msyear.toString()
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
          class: `mx-auto px-2 py-1 rounded text-xs font-medium ${
            isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
        h(DropdownAction, { student })
      );
    },
  },
];

export interface Student {
  id: number;
  name: string;
  email: string;
  school: string;
  msyear: number;
  classroom: number;
  status: "registered" | "unregistered";
  // action column still needed
}
