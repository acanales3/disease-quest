<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";

import pdfMake from "pdfmake/build/pdfmake";

import type {
  TDocumentDefinitions,
  Content,
  ContentText,
  ContentCanvas,
  ContentStack,
  ContentColumns,
  ContentTable,
  TableCell,
} from "pdfmake/interfaces";

// vfs is now initialized globally in plugins/pdfmake.client.ts

type CategoryScore = {
  label: string;
  score: number;
};

type ReflectionDocData = {
  studentName?: string;
  caseTitle: string;
  completionDate: string;
  highest: { score: number; category: string };
  lowest: { score: number; category: string };
  categories: CategoryScore[];
  strengths: string[];
  areasOfGrowth: string[];
  keyMistakes: string[];
  documentId?: string;
  reflectionNotes?: string;
};

const props = defineProps<{
  caseId: number;

  // not in DB yet
  strengths: string[];
  areasOfGrowth: string[];
  keyMistakes: string[];
}>();

const isLoading = ref(false);
const errorMsg = ref("");

// ---------- Helpers ----------
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const scoreText = (score: number) => `${Math.round(score)}%`;

const formatCompletion = (raw: string) => {
  const parsed = dayjs(raw);
  const dt = parsed.isValid() ? parsed : dayjs();
  return dt.format("MMM DD, YYYY • hh:mm A");
};

const pill = (
  text: string,
  bg = "#F3F4F6",
  color = "#111827",
): ContentTable => ({
  table: {
    widths: ["auto"],
    body: [
      [
        {
          text,
          color,
          bold: true,
          fontSize: 9,
          margin: [8, 4, 8, 4],
          alignment: "center",
        } as TableCell,
      ],
    ],
  },
  layout: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
    fillColor: () => bg,
  },
});

const listOrDash = (items: string[]): Content => {
  if (!items?.length) return { text: "—", color: "#6B7280" } as ContentText;
  return {
    ul: items.map((x) => ({ text: x, margin: [0, 3, 0, 3] })),
  } as any;
};

const card = (title: string, big: string, subtitle: string): ContentTable => ({
  table: {
    widths: ["*"],
    body: [
      [
        {
          stack: [
            { text: title, style: "cardTitle" },
            { text: big, style: "cardBig" },
            { text: subtitle, style: "cardMeta" },
          ],
          margin: [12, 10, 12, 10],
        } as TableCell,
      ],
    ],
  },
  layout: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    fillColor: () => "#F9FAFB",
  },
});

const sectionCard = (
  title: string,
  accent: string,
  bg: string,
  items: string[],
): ContentTable => ({
  table: {
    widths: [6, "*"],
    body: [
      [
        { text: "", fillColor: accent, margin: [0, 0, 0, 0] } as TableCell,
        {
          stack: [
            { text: title, style: "sectionCardTitle" },
            listOrDash(items),
          ],
          margin: [12, 10, 12, 10],
        } as TableCell,
      ],
    ],
  },
  layout: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    fillColor: (_rowIndex: number, _node: any, columnIndex: number) =>
      columnIndex === 1 ? bg : null,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  },
});

const textCard = (
  title: string,
  accent: string,
  bg: string,
  body: string,
): ContentTable => ({
  table: {
    widths: [6, "*"],
    body: [
      [
        { text: "", fillColor: accent, margin: [0, 0, 0, 0] } as TableCell,
        {
          stack: [
            { text: title, style: "sectionCardTitle" },
            body?.trim()
              ? ({ text: body, style: "noteBody" } as ContentText)
              : ({ text: "—", color: "#6B7280" } as ContentText),
          ],
          margin: [12, 10, 12, 10],
        } as TableCell,
      ],
    ],
  },
  layout: {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    fillColor: (_rowIndex: number, _node: any, columnIndex: number) =>
      columnIndex === 1 ? bg : null,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0,
  },
});

const scoreBarRow = (label: string, score: number): ContentColumns => {
  const barW = 320;
  const barH = 12;
  const pct = clamp((score ?? 0) / 100, 0, 1);
  const fillW = Math.round(barW * pct);

  const barCanvas: ContentCanvas = {
    canvas: [
      {
        type: "rect",
        x: 0,
        y: 0,
        w: barW,
        h: barH,
        r: 2,
        lineWidth: 0,
        color: "#EEF2F7",
      } as any,
      {
        type: "rect",
        x: 0,
        y: 0,
        w: fillW,
        h: barH,
        r: 2,
        lineWidth: 0,
        color: "#AF67F0",
      } as any,
    ],
    margin: [0, 6, 0, 0],
  };

  return {
    columns: [
      {
        width: 52,
        stack: [pill(scoreText(score ?? 0), "#F3F4F6", "#111827")],
        margin: [0, 0, 10, 0],
      },
      { width: barW, stack: [barCanvas] },
      {
        width: "*",
        text: label,
        style: "rubricLabel",
        margin: [12, 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 10],
  };
};

const buildDocDefinition = (d: ReflectionDocData): TDocumentDefinitions => {
  const completed = formatCompletion(d.completionDate);
  const docId = d.documentId || "";

  const rubricBlock: ContentStack = {
    stack: [
      { text: "Scores Rubric", style: "sectionHeader", margin: [0, 0, 0, 10] },
      ...(d.categories ?? []).map((c) => scoreBarRow(c.label, c.score)),
    ],
    margin: [0, 2, 0, 18],
  };

  const content: Content[] = [
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "Reflection Document", style: "title" },
            { text: d.caseTitle, style: "subtitle" },
          ],
        },
        {
          width: "auto",
          stack: [
            {
              text: `Completed: ${completed}`,
              style: "meta",
              alignment: "right",
            },
            d.studentName
              ? ({
                  text: d.studentName,
                  style: "meta",
                  alignment: "right",
                } as ContentText)
              : ({
                  text: "",
                  style: "meta",
                  alignment: "right",
                } as ContentText),
          ],
        },
      ],
      margin: [0, 18, 0, 16],
    },

    {
      columns: [
        card("Highest Score", scoreText(d.highest.score), d.highest.category),
        card("Lowest Score", scoreText(d.lowest.score), d.lowest.category),
      ],
      columnGap: 12,
      margin: [0, 0, 0, 18],
    },

    rubricBlock,

    {
      columns: [
        sectionCard("Strengths", "#16A34A", "#ECFDF5", d.strengths),
        sectionCard("Areas of Growth", "#F59E0B", "#FFFBEB", d.areasOfGrowth),
      ],
      columnGap: 12,
      margin: [0, 0, 0, 12],
    },

    sectionCard("Key Mistakes", "#EF4444", "#FEF2F2", d.keyMistakes),
  ];

  if (d.reflectionNotes?.trim()) {
    content.push({ text: "", margin: [0, 0, 0, 12] } as any);
    content.push(
      textCard("Reflection Notes", "#AF67F0", "#F5F3FF", d.reflectionNotes),
    );
  }

  return {
    pageSize: "LETTER",
    pageMargins: [48, 48, 48, 64],
    info: { title: `Reflection - ${d.caseTitle} - ${d.completionDate}` },

    background: () => ({
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: 612,
          h: 10,
          lineWidth: 0,
          color: "#AF67F0",
        } as any,
      ],
    }),

    footer: (currentPage: number, pageCount: number) =>
      ({
        margin: [48, 0, 48, 18],
        columns: [
          {
            width: "*",
            text: `Generated by DiseaseQuest • Document ID: ${docId}`,
            style: "footerText",
          },
          {
            width: "auto",
            text: `Page ${currentPage} of ${pageCount}`,
            style: "footerText",
            alignment: "right",
          },
        ],
      }) as any,

    content,

    styles: {
      title: { fontSize: 22, bold: true, color: "#111827" },
      subtitle: { fontSize: 12, color: "#6B7280", margin: [0, 3, 0, 0] },
      meta: { fontSize: 10, color: "#6B7280" },

      sectionHeader: { fontSize: 12, bold: true, color: "#111827" },

      cardTitle: { fontSize: 10, color: "#6B7280", margin: [0, 0, 0, 6] },
      cardBig: {
        fontSize: 22,
        bold: true,
        color: "#111827",
        margin: [0, 0, 0, 4],
      },
      cardMeta: { fontSize: 10, color: "#4B5563" },

      rubricLabel: { fontSize: 10, color: "#111827", margin: [0, 7, 0, 0] },

      sectionCardTitle: {
        fontSize: 11,
        bold: true,
        color: "#111827",
        margin: [0, 0, 0, 6],
      },

      noteBody: { fontSize: 10, color: "#111827", lineHeight: 1.25 },

      footerText: { fontSize: 9, color: "#9CA3AF" },
    },

    defaultStyle: { font: "Roboto", fontSize: 10, color: "#111827" },
  };
};

const toReflectionDocData = (api: any): ReflectionDocData => {
  const s = api?.scores || {};

  const categories: CategoryScore[] = [
    {
      label: "History Taking and Synthesis",
      score: Number(s.historyTakingSynthesis ?? 0) || 0,
    },
    {
      label: "Physical Exam Interpretation",
      score: Number(s.physicalExamInterpretation ?? 0) || 0,
    },
    {
      label: "Differential Diagnosis Formulation",
      score: Number(s.differentialDiagnosisFormulation ?? 0) || 0,
    },
    { label: "Diagnostic Tests", score: Number(s.diagnosticTests ?? 0) || 0 },
    {
      label: "Management Reasoning",
      score: Number(s.managementReasoning ?? 0) || 0,
    },
    {
      label: "Communication and Empathy",
      score: Number(s.communicationEmpathy ?? 0) || 0,
    },
    {
      label: "Reflection and Metacognition",
      score: Number(s.reflectionMetacognition ?? 0) || 0,
    },
  ];

  const safeInit: CategoryScore = { label: "—", score: 0 };
  const highest = categories.reduce(
    (a, b) => (b.score > a.score ? b : a),
    safeInit,
  );
  const lowest = categories.reduce(
    (a, b) => (b.score < a.score ? b : a),
    safeInit,
  );

  return {
    studentName: api?.student?.name || "",
    caseTitle: api?.caseTitle || `Case ${api?.caseId ?? ""}`,
    completionDate: api?.createdAt || dayjs().toISOString(),
    documentId: api?.id != null ? String(api.id) : undefined,

    highest: { score: highest.score, category: highest.label },
    lowest: { score: lowest.score, category: lowest.label },

    categories,

    strengths: props.strengths,
    areasOfGrowth: props.areasOfGrowth,
    keyMistakes: props.keyMistakes,

    reflectionNotes:
      typeof api?.reflectionDocument === "string" ? api.reflectionDocument : "",
  };
};

async function onViewPdf() {
  if (isLoading.value) return;

  errorMsg.value = "";
  isLoading.value = true;

  const t0 = performance.now();

  try {
    // 1) Fetch API (timeout guarded)
    const controller = new AbortController();
    const fetchTimeout = window.setTimeout(() => controller.abort(), 15000);

    let api: any;
    try {
      api = await $fetch("/api/evaluations/reflection", {
        query: { caseId: props.caseId },
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(fetchTimeout);
    }

    // 2) Build doc definition
    const data = toReflectionDocData(api);
    const dd = buildDocDefinition(data);

    // 3) Create PDF and open directly (like the working example)
    pdfMake.createPdf(dd).open();
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? "Request timed out fetching reflection data."
        : e?.data?.message ||
          e?.message ||
          "Failed to generate reflection PDF.";

    errorMsg.value = msg;
    console.error("[ReflectionPDF] error", e);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <Button
      class="px-6 py-8 bg-[#AF67F0] text-white rounded-lg hover:bg-[#AF67F0]/80 disabled:opacity-60"
      aria-label="Forward"
      :disabled="isLoading"
      @click="onViewPdf"
    >
      {{ isLoading ? "Generating..." : "View Reflection Document" }}
    </Button>

    <p v-if="errorMsg" class="text-sm text-red-500">
      {{ errorMsg }}
    </p>
  </div>
</template>
