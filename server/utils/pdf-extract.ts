/**
 * Document extraction utilities for PDF and DOCX uploads.
 *
 * PDFs first attempt embedded text extraction and then fall back to
 * page-by-page OCR using a vision LLM when needed.
 */

import { DOMMatrix, ImageData, Path2D, createCanvas } from "@napi-rs/canvas";
import mammoth from "mammoth";
import OpenAI from "openai";
import pdf from "pdf-parse";

const MIN_EMBEDDED_TEXT_LENGTH = 120;
const OCR_MODEL = "gpt-4o-mini";
const OCR_IMAGE_DETAIL = "low";
const OCR_MAX_DIMENSION_PX = 1400;

if (!(globalThis as Record<string, unknown>).DOMMatrix) {
  (globalThis as Record<string, unknown>).DOMMatrix = DOMMatrix;
}
if (!(globalThis as Record<string, unknown>).ImageData) {
  (globalThis as Record<string, unknown>).ImageData = ImageData;
}
if (!(globalThis as Record<string, unknown>).Path2D) {
  (globalThis as Record<string, unknown>).Path2D = Path2D;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is required for OCR fallback on image-based PDFs.",
    );
  }

  return new OpenAI({ apiKey });
}

async function renderPdfPagesToPngDataUrls(fileBuffer: Buffer): Promise<string[]> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(fileBuffer) });
  const pdfDoc = await loadingTask.promise;
  const images: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber++) {
      const page = await pdfDoc.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const longestSide = Math.max(baseViewport.width, baseViewport.height) || 1;
      const scale = Math.min(
        2,
        Math.max(0.75, OCR_MAX_DIMENSION_PX / longestSide),
      );
      const viewport = page.getViewport({ scale });

      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      );
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const imageBuffer = canvas.toBuffer("image/png");
      images.push(`data:image/png;base64,${imageBuffer.toString("base64")}`);
      page.cleanup?.();
    }
  } finally {
    pdfDoc.cleanup?.();
    pdfDoc.destroy?.();
    loadingTask.destroy?.();
  }

  return images;
}

async function extractTextFromPdfImages(fileBuffer: Buffer): Promise<string> {
  const client = getOpenAIClient();
  const pageImages = await renderPdfPagesToPngDataUrls(fileBuffer);
  const pageTexts: string[] = [];

  for (let i = 0; i < pageImages.length; i++) {
    const completion = await client.chat.completions.create({
      model: OCR_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an OCR extraction assistant. Extract all readable text from the provided document page and return plain text only. Preserve headings, bullets, tables, and labels as faithfully as possible.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract all readable text from PDF page ${i + 1}. Return plain text only. Do not summarize. If a section is unreadable, omit it instead of guessing.`,
            },
            {
              type: "image_url",
              image_url: {
                url: pageImages[i],
                detail: OCR_IMAGE_DETAIL,
              },
            },
          ],
        },
      ],
    } as any);

    const pageText = completion.choices[0]?.message?.content?.trim();
    if (pageText) {
      pageTexts.push(`--- Page ${i + 1} ---\n${pageText}`);
    }
  }

  const combined = pageTexts.join("\n\n").trim();
  if (!combined) {
    throw new Error("Vision OCR did not return readable text for this PDF.");
  }

  return combined;
}

/**
 * Extract all text content from a PDF buffer.
 * @param fileBuffer - The raw PDF file as a Buffer or Uint8Array
 * @returns The extracted text content
 */
export async function extractPdfText(
  fileBuffer: Buffer | Uint8Array,
): Promise<string> {
  const data =
    fileBuffer instanceof Uint8Array ? Buffer.from(fileBuffer) : fileBuffer;

  let embeddedText = "";
  let embeddedTextError: string | null = null;

  try {
    const result = await pdf(data);
    embeddedText = result.text?.trim() ?? "";
  } catch (err: unknown) {
    embeddedTextError = err instanceof Error ? err.message : String(err);
  }

  if (embeddedText.length >= MIN_EMBEDDED_TEXT_LENGTH) {
    return embeddedText;
  }

  try {
    const visionText = await extractTextFromPdfImages(data);
    if (embeddedText) {
      return `${embeddedText}\n\n--- Vision OCR Supplement ---\n${visionText}`;
    }
    return visionText;
  } catch (visionErr: unknown) {
    if (embeddedText) {
      return embeddedText;
    }

    const visionMsg =
      visionErr instanceof Error ? visionErr.message : String(visionErr);
    const embeddedMsg = embeddedTextError
      ? ` Embedded text extraction error: ${embeddedTextError}.`
      : "";

    throw new Error(
      `PDF contains no usable embedded text and OCR fallback failed: ${visionMsg}.${embeddedMsg}`,
    );
  }
}

export async function extractDocxText(
  fileBuffer: Buffer | Uint8Array,
): Promise<string> {
  const data =
    fileBuffer instanceof Uint8Array ? Buffer.from(fileBuffer) : fileBuffer;

  const result = await mammoth.extractRawText({ buffer: data });
  const text = result.value?.trim() ?? "";

  if (!text) {
    throw new Error("DOCX appears to be empty or contains no extractable text.");
  }

  return text;
}

export async function extractDocumentText(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  contentType?: string,
): Promise<string> {
  const normalizedName = filename.toLowerCase();
  const normalizedType = (contentType ?? "").toLowerCase();

  if (
    normalizedType === "application/pdf" ||
    normalizedName.endsWith(".pdf")
  ) {
    return extractPdfText(fileBuffer);
  }

  if (
    normalizedType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedName.endsWith(".docx")
  ) {
    return extractDocxText(fileBuffer);
  }

  throw new Error("Unsupported document type. Please upload a PDF or DOCX file.");
}
