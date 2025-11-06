import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/CaseDatatable/data-table-dropdown.vue";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";

xport const columns: ColumnDef<Case>[] = [
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
    accessorKey: "description",
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
    accessorKey: "completionDate",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Completion Date"),
    cell: ({ row }) => {
      const completionDate = row.getValue("completionDate") as string;
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        completionDate
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
      "not started": "bg-gray-100 text-gray-700",
      "in progress": "bg-blue-100 text-blue-700",
      "completed": "bg-green-100 text-green-700"
    };

    const statusText = {
      "not started": "Not Started",
      "in progress": "In Progress",
      "completed": "Completed"
    };

    return h(
      "span",
      {
        class: `mx-auto px-2 py-1 rounded text-xs font-medium ${statusClasses[status]}`,
      },
      statusText[status]
    );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const case = row.original;

      return h(
        "div",
        { class: "relative flex justify-center" },
        h(DropdownAction, { case })
      );
    },
  },
];

export interface Case {
  id: number;
  name: string;
  description: string;
  classroom: number;
  completionDate: string;
  status: "not started" | "in progress" | "completed";
  // action column still needed
}