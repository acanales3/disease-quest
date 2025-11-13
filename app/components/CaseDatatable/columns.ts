import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

export const columns: ColumnDef<Case>[] = [
  {
    accessorKey: "id",
    header: () =>
      h("div", { class: "text-center font-semibold text-gray-700" }, "No"),
    cell: ({ row }) => {
      const id = row.getValue("id") as number;
      return h(
        "div",
        { class: "text-center font-medium text-gray-600" },
        String(id).padStart(2, '0')
      );
    },
  },
  {
    accessorKey: "name",
    header: () =>
      h("div", { class: "text-center font-semibold text-gray-700" }, "Task"),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return h("div", { class: "text-center font-medium text-gray-800" }, name);
    },
  },
  {
    accessorKey: "description",
    header: () =>
      h("div", { class: "text-center font-semibold text-gray-700" }, "Description"),
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return h("div", { class: "text-center font-normal text-gray-600" }, description);
    },
  },
  {
    accessorKey: "classroom",
    header: () =>
      h("div", { class: "text-center font-semibold text-gray-700" }, "Classroom"),
    cell: ({ row }) => {
      const room = row.getValue("classroom") as string;
      return h(
        "div",
        { class: "text-center font-medium text-gray-700" },
        room
      );
    },
  },
  {
    accessorKey: "completionDate",
    header: () =>
      h("div", { class: "text-center font-semibold text-gray-700" }, "Completion Date"),
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
      h("div", { class: "text-center font-semibold text-gray-700" }, "Status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as Case["status"];
    
    const statusClasses = {
      "not started": "bg-red-50 text-red-600 border border-red-200",
      "in progress": "bg-blue-50 text-blue-600 border border-blue-200",
      "completed": "bg-green-50 text-green-600 border border-green-200"
    };

    const statusText = {
      "not started": "Not Started",
      "in progress": "In Progress",
      "completed": "Completed"
    };

    return h(
      "span",
      {
        class: `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status]}`,
      },
      statusText[status]
    );
    },
  },
  {
    id: "actions",
    header: () =>
      h("div", { class: "text-center font-semibold text-gray-700" }, "Action"),
    enableHiding: false,
    cell: ({ row }) => {
      const caseData = row.original;

      return h(
        "div",
        { class: "flex items-center justify-center gap-2" },
        [
          h(
            "button",
            {
              class: "p-2 hover:bg-gray-100 rounded-md transition-colors",
              title: "Edit",
              onClick: () => {
                console.log("Edit case:", caseData);
              }
            },
            h("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              class: "text-gray-600"
            }, [
              h("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }),
              h("path", { d: "m15 5 4 4" })
            ])
          ),
          h(
            "button",
            {
              class: "p-2 hover:bg-gray-100 rounded-md transition-colors",
              title: "Delete",
              onClick: () => {
                console.log("Delete case:", caseData);
              }
            },
            h("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              width: "18",
              height: "18",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              class: "text-gray-600"
            }, [
              h("path", { d: "M3 6h18" }),
              h("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
              h("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })
            ])
          )
        ]
      );
    },
  },
];

export interface Case {
  id: number;
  name: string;
  description: string;
  classroom: string;
  completionDate: string;
  status: "not started" | "in progress" | "completed";
}