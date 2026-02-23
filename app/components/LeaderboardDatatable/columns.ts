import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { ArrowUpDown } from "lucide-vue-next";
import type { LeaderboardEntry } from "../../assets/interface/Leaderboard";

export const baseColumns: ColumnDef<LeaderboardEntry>[] = [
  {
    accessorKey: "rank",
    header: ({ column }) =>
      h(
        "button",
        {
          class:
            "flex justify-center items-center gap-1 font-normal text-black w-full px-3 py-1 rounded-md hover:bg-gray-200",
          onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
        },
        ["Rank", h(ArrowUpDown, { class: "h-4 w-4" })]
      ),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("rank")?.toString() || "-"
      ),
  },
  {
    accessorKey: "nickname",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Nickname"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("nickname") || "-"
      ),
  },
  {
    accessorKey: "classroomName",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Classroom"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("classroomName") || "-"
      ),
  },
  {
    accessorKey: "casesCompleted",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Cases Completed"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        row.getValue("casesCompleted")?.toString() || "0"
      ),
  },
  {
    accessorKey: "averageScore",
    header: () =>
      h("div", { class: "text-center font-normal text-black" }, "Average Score"),
    cell: ({ row }) => {
      const score = row.getValue("averageScore");
      return h(
        "div",
        { class: "text-center font-normal text-gray-600" },
        typeof score === "number" ? `${score.toFixed(2)}%` : "-"
      );
    },
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
