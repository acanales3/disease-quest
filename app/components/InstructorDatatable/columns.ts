import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/InstructorDatatable/data-table-dropdown.vue";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";

export const columns: ColumnDef<Instructor>[] = [
  {
    accessorKey: "id",
    header: () => h("div", { class: "text-left font-medium" }, "ID"),
    cell: ({ row }) => {
      const id = row.getValue("id") as number;
      return h("div", { class: "text-left" }, id.toString());
    },
  },
  {
    accessorKey: "name",
    header: () => h("div", { class: "text-left font-medium" }, "Name"),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return h("div", { class: "text-left font-medium" }, name);
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: "ghost",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        () => ["Email", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })]
      );
    },
    cell: ({ row }) => h("div", { class: "lowercase" }, row.getValue("email")),
  },
  {
    accessorKey: "school",
    header: () => h("div", { class: "text-left font-medium" }, "School"),
    cell: ({ row }) => {
      const school = row.getValue("school") as string;
      return h("div", { class: "text-left" }, school);
    },
  },
  {
    accessorKey: "classroom",
    header: () => h("div", { class: "text-center font-medium" }, "Classroom #"),
    cell: ({ row }) => {
      const room = row.getValue("classroom") as number;
      return h("div", { class: "text-center" }, room.toString());
    },
  },
  {
    accessorKey: "status",
    header: () => h("div", { class: "text-center font-medium" }, "Status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as Instructor["status"];
      const isActive = status === "active";

      return h(
        "span",
        {
          class: `px-2 py-1 rounded text-xs font-semibold ${
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
        { class: "relative" },
        h(DropdownAction, {
          instructor,
        })
      );
    },
  },
];

export interface Instructor {
  id: number;
  name: string;
  email: string;
  school: string;
  classroom: number;
  status: "active" | "deactived";
  // action column still needed
}

// export const Instructor: Instructor[] = [
//   {
//     id: 0,
//     name: "Dr. Nath",
//     email: "nath@tcu.edu",
//     school: "Texas Christian University",
//     classroom: 0,
//     status: "active",
//   },
//   {
//     id: 1,
//     name: "Professor 1",
//     email: "prof1@university.edu",
//     school: "University of Metro",
//     classroom: 101,
//     status: "active",
//   },
//   {
//     id: 2,
//     name: "Professor 2",
//     email: "prof2@college.edu",
//     school: "Riverbend College",
//     classroom: 202,
//     status: "active",
//   },
//   {
//     id: 3,
//     name: "Professor 3",
//     email: "prof3@institute.edu",
//     school: "Northpoint Institute",
//     classroom: 303,
//     status: "deactived",
//   },
//   {
//     id: 4,
//     name: "Professor 4",
//     email: "prof4@academy.edu",
//     school: "Lakeside Academy",
//     classroom: 404,
//     status: "active",
//   },
//   {
//     id: 5,
//     name: "Professor 5",
//     email: "prof5@state.edu",
//     school: "State Tech University",
//     classroom: 505,
//     status: "active",
//   },
//   {
//     id: 6,
//     name: "Professor 6",
//     email: "prof6@poly.edu",
//     school: "Polytechnic College",
//     classroom: 606,
//     status: "deactived",
//   },
//   {
//     id: 7,
//     name: "Professor 7",
//     email: "prof7@edu.org",
//     school: "Eastern University",
//     classroom: 707,
//     status: "active",
//   },
//   {
//     id: 8,
//     name: "Professor 8",
//     email: "prof8@uni.edu",
//     school: "Central University",
//     classroom: 808,
//     status: "active",
//   },
//   {
//     id: 9,
//     name: "Professor 9",
//     email: "prof9@school.edu",
//     school: "Valley School of Science",
//     classroom: 909,
//     status: "active",
//   },
// ];
