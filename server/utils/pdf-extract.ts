/**
 * PDF Text Extraction Utility
 * Extracts raw text content from a PDF file buffer using pdf-parse v2.
 */

import pdf from "pdf-parse";

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

  const result = await pdf(data);

  const text = result.text?.trim();

  if (!text || text.length === 0) {
    throw new Error(
      "PDF appears to be empty or contains no extractable text (it may be image-based).",
    );
  }

  return text;
}
