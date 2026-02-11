import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { ArrowUpDown } from "lucide-vue-next";
import type { LeaderboardEntry } from "../../assets/interface/Leaderboard";
import { leaderboard } from "../../assets/interface/Leaderboard";

export const baseColumns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: "position",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Rank"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("position")?.toString() || "-"
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
    accessorKey: "score",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Score", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("score")?.toString() || "-"
      ),
  },
];

export const adminColumns: ColumnDef<LeaderboardEntry>[] = [
  ...baseColumns.slice(0, 1), // position
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
  ...baseColumns.slice(1), // nickname + score
];
