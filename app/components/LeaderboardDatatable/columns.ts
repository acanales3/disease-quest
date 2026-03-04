import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";
import { ArrowUpDown } from "lucide-vue-next";
import type { LeaderboardEntry } from "../../assets/interface/Leaderboard";

export const baseColumns: ColumnDef<LeaderboardEntry>[] = [
  {
    id: "position",
    accessorKey: "rank",
    header: () => h("div", {}, "#"),
    cell: ({ row }) => {
      const pos = row.index + 1;
      const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
      const medal = medals[pos];
      return h("div", { class: "flex items-center gap-2" }, [
        medal ? h("span", { class: "text-base leading-none" }, medal) : null,
        h("span", { class: "text-sm font-medium text-gray-700 tabular-nums" }, String(pos)),
      ]);
    },
  },
  {
    accessorKey: "nickname",
    header: () => h("div", {}, "NICKNAME"),
    cell: ({ row }) => h("div", { class: "text-gray-600" }, row.getValue("nickname") || "-"),
  },
  {
    accessorKey: "classroomName",
    header: () => h("div", {}, "CLASSROOM"),
    cell: ({ row }) => h("div", { class: "text-gray-600" }, row.getValue("classroomName") || "-"),
  },
  {
    accessorKey: "casesCompleted",
    header: () => h("div", {}, "CASES COMPLETED"),
    cell: ({ row }) => h("div", { class: "font-medium text-gray-900 tabular-nums" }, row.getValue("casesCompleted")?.toString() || "0"),
  },
  {
    accessorKey: "averageScore",
    header: () => h("div", {}, "AVG. SCORE"),
    cell: ({ row }) => {
      const score = row.getValue("averageScore");
      const formatted = typeof score === "number" ? `${score.toFixed(2)}%` : "-";
      const isHigh = typeof score === "number" && score >= 70;
      return h("span", {
        class: `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
          isHigh ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-600 border border-gray-200"
        }`,
      }, formatted);
    },
  },
];

export const adminColumns: ColumnDef<LeaderboardEntry>[] = [
  ...baseColumns.slice(0, 1),
  {
    accessorKey: "studentName",
    header: () => h("div", {}, "STUDENT"),
    cell: ({ row }) => h("div", { class: "font-medium text-gray-900" }, row.getValue("studentName") || "-"),
  },
  ...baseColumns.slice(1),
];
