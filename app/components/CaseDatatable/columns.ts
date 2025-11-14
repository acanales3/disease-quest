import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import DropdownAction from "@/components/CaseDatatable/data-table-dropdown.vue";
import { ArrowUpDown, ChevronDown } from "lucide-vue-next";
import { Button } from "~/components/ui/button";

export const columns: ColumnDef<Case>[] = [
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
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Description"),
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return h("div", { class: "text-center font-normal text-gray-600" }, description);
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
      "not started": "bg-gray-100 text-red-700",
      "in progress": "bg-gray-100 text-blue-700",
      "completed": "bg-gray-100 text-green-700"
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
      const caseData = row.original;

      return h(
        "div",
        { class: "relative flex justify-center" },
        h(DropdownAction, {
          caseData,
          onPlay: (data: Case) => {
            // Emit play event - will be handled by parent component
            window.dispatchEvent(
              new CustomEvent("case:play", { detail: data })
            );
          },
          onEdit: (data: Case) => {
            // Emit edit event
            window.dispatchEvent(
              new CustomEvent("case:edit", { detail: data })
            );
          },
          onDelete: (data: Case) => {
            // Emit delete event
            window.dispatchEvent(
              new CustomEvent("case:delete", { detail: data })
            );
          },
        })
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