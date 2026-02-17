import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { ArrowUpDown } from "lucide-vue-next";
import type { LeaderboardEntry } from "../../assets/interface/Leaderboard";

export const baseColumns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: "rank",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Rank"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("rank")?.toString() || "-"
      ),
  },
  {
    accessorKey: "nickname",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Nickname", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("nickname") || "-"
      ),
  },
  {
    accessorKey: "classroomName",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Classroom", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("classroomName") || "-"
      ),
  },
  {
    accessorKey: "casesCompleted",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Cases Completed", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("casesCompleted")?.toString() || "0"
      ),
  },
  {
    accessorKey: "averageScore",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Average Score", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("averageScore") ? `${row.getValue("averageScore")}%` : "-"
      ),
  },
];

export const adminColumns: ColumnDef<LeaderboardEntry>[] = [
  ...baseColumns.slice(0, 1), // rank
  {
    accessorKey: "studentName",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Student Name"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("studentName") || "-"
      ),
  },
  ...baseColumns.slice(1), // rest
];
