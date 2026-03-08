import type { ColumnDef } from "@tanstack/vue-table";
import { h, ref, onMounted, onBeforeUnmount, defineComponent } from "vue";
import type { LeaderboardEntry } from "../../assets/interface/Leaderboard";

// ── Reusable hover-tooltip cell component ─────────────────────────────────────
// Renders a number badge that, on hover, shows a popover listing the details.
// Built as a defineComponent so it can use Vue reactivity (ref) for open state.
const HoverCell = defineComponent({
  props: {
    value: { type: Number, required: true },
    rows: {
      type: Array as () => Array<{ label: string; sub: string }>,
      required: true,
    },
    emptyText: { type: String, default: "No data" },
    badgeClass: { type: String, default: "" },
  },
  setup(props) {
    const open = ref(false);
    const triggerRef = ref<HTMLElement | null>(null);

    // Close on outside click
    function onOutside(e: MouseEvent) {
      if (triggerRef.value && !triggerRef.value.contains(e.target as Node)) {
        open.value = false;
      }
    }
    onMounted(() => document.addEventListener("mousedown", onOutside));
    onBeforeUnmount(() => document.removeEventListener("mousedown", onOutside));

    return () => {
      const hasRows = props.rows.length > 0;

      return h(
        "div",
        {
          ref: triggerRef,
          class: "relative inline-block",
          onMouseenter: () => {
            open.value = true;
          },
          onMouseleave: () => {
            open.value = false;
          },
        },
        [
          // Badge / trigger
          h(
            "button",
            {
              class: [
                "inline-flex items-center gap-1 font-medium tabular-nums text-gray-900 cursor-default",
                "select-none focus:outline-none",
                props.badgeClass,
              ].join(" "),
              type: "button",
            },
            [
              String(props.value),
              hasRows
                ? h(
                    "span",
                    {
                      class:
                        "w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-semibold flex items-center justify-center leading-none",
                    },
                    "i",
                  )
                : null,
            ],
          ),

          // Popover — only rendered when open and there are rows
          open.value && hasRows
            ? h(
                "div",
                {
                  class: [
                    "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2",
                    "bg-white border border-gray-200 rounded-xl shadow-lg",
                    "min-w-[200px] max-w-[280px] py-2",
                    "pointer-events-none", // tooltip only — no interaction needed
                  ].join(" "),
                },
                [
                  // Arrow
                  h("div", {
                    class:
                      "absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-white border-r border-b border-gray-200 -mt-[5px]",
                  }),

                  // Rows
                  ...props.rows.map((row) =>
                    h(
                      "div",
                      {
                        class:
                          "flex items-center justify-between gap-4 px-3.5 py-1.5",
                      },
                      [
                        h(
                          "span",
                          {
                            class:
                              "text-[12px] text-gray-700 leading-snug truncate",
                          },
                          row.label,
                        ),
                        h(
                          "span",
                          {
                            class:
                              "text-[11px] font-semibold text-gray-500 tabular-nums shrink-0",
                          },
                          row.sub,
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : null,
        ],
      );
    };
  },
});

// ── Column definitions ────────────────────────────────────────────────────────

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
        h(
          "span",
          { class: "text-sm font-medium text-gray-700 tabular-nums" },
          String(pos),
        ),
      ]);
    },
  },
  {
    accessorKey: "nickname",
    header: () => h("div", {}, "NICKNAME"),
    cell: ({ row }) =>
      h("div", { class: "text-gray-600" }, row.getValue("nickname") || "-"),
  },
  {
    accessorKey: "classroomName",
    header: () => h("div", {}, "CLASSROOM"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-gray-600" },
        row.getValue("classroomName") || "-",
      ),
  },

  // ── Cases Completed — hover shows which cases ─────────────────
  {
    accessorKey: "casesCompleted",
    header: () => h("div", {}, "CASES COMPLETED"),
    cell: ({ row }) => {
      const entry = row.original as LeaderboardEntry;
      const details = entry.caseDetails ?? [];

      // Deduplicate by caseId (one entry per unique completed case)
      const uniqueCases = Array.from(
        new Map(details.map((d) => [d.caseId, d])).values(),
      );

      const tooltipRows = uniqueCases.map((d) => ({
        label: d.caseName,
        sub: `${d.attempts} attempt${d.attempts !== 1 ? "s" : ""}`,
      }));

      return h(HoverCell, {
        value: entry.casesCompleted,
        rows: tooltipRows,
        emptyText: "No cases completed",
      });
    },
  },

  // ── Attempts — hover shows per-case attempt breakdown ─────────
  {
    accessorKey: "attemptsCompleted",
    header: () => h("div", {}, "ATTEMPTS"),
    cell: ({ row }) => {
      const entry = row.original as LeaderboardEntry;
      const details = entry.caseDetails ?? [];

      const tooltipRows = details.map((d) => ({
        label: d.caseName,
        sub: `${d.attempts}×`,
      }));

      return h(HoverCell, {
        value: entry.attemptsCompleted ?? 0,
        rows: tooltipRows,
        emptyText: "No attempts",
        badgeClass: "text-[#4d1979]",
      });
    },
  },

  // ── Average Score ─────────────────────────────────────────────
  {
    accessorKey: "averageScore",
    header: () => h("div", {}, "AVG. SCORE"),
    cell: ({ row }) => {
      const score = row.getValue("averageScore");
      const formatted =
        typeof score === "number" ? `${score.toFixed(2)}%` : "-";
      const isHigh = typeof score === "number" && score >= 70;
      return h(
        "span",
        {
          class: `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold tabular-nums ${
            isHigh
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-gray-50 text-gray-600 border border-gray-200"
          }`,
        },
        formatted,
      );
    },
  },
];

export const adminColumns: ColumnDef<LeaderboardEntry>[] = [
  ...baseColumns.slice(0, 1),
  {
    accessorKey: "studentName",
    header: () => h("div", {}, "STUDENT"),
    cell: ({ row }) =>
      h(
        "div",
        { class: "font-medium text-gray-900" },
        row.getValue("studentName") || "-",
      ),
  },
  ...baseColumns.slice(1),
];
