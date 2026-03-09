/**
 * POST /api/cases/create
 *
 * Case Upload Pipeline — receives a PDF + metadata from the admin,
 * extracts text, generates case content via OpenAI, validates it,
 * and inserts into the database. Retries intelligently on failure
 * with strict guardrails against infinite loops.
 *
 * Body: multipart/form-data with:
 *   - file: PDF or DOCX file
 *   - caseName: string
 *   - caseDescription: string
 *   - rubricFile?: optional PDF/DOCX/TXT/MD/JSON rubric file
 */

import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from "#supabase/server";
import { extractDocumentText, extractPdfText } from "../../utils/pdf-extract";
import { generateCaseContent } from "../../utils/case-generator";
import { validateCaseSchema } from "../../utils/case-schema";

// ---------------------------------------------------------------------------
// Guardrails
// ---------------------------------------------------------------------------
const MAX_AI_RETRIES = 3; // Max attempts to generate valid JSON
const MAX_DB_RETRIES = 3; // Max attempts to insert into DB (with AI fix)
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_RUBRIC_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// Logger helper
// ---------------------------------------------------------------------------
function log(step: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[CASE-PIPELINE ${timestamp}] [${step}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, typeof data === "string" ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${message}`);
  }
}

async function extractUploadedText(
  fileBuffer: Buffer,
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
    return extractDocumentText(fileBuffer, filename, contentType);
  }

  const isTextLike =
    normalizedType.startsWith("text/") ||
    normalizedType === "application/json" ||
    normalizedName.endsWith(".txt") ||
    normalizedName.endsWith(".md") ||
    normalizedName.endsWith(".json");

  if (!isTextLike) {
    throw new Error(
      "Unsupported rubric file type. Please upload PDF, DOCX, TXT, MD, or JSON.",
    );
  }

  const text = fileBuffer.toString("utf-8").trim();
  if (!text) {
    throw new Error("Rubric file appears to be empty.");
  }

  return text;
}

function attachRubricSource(
  caseContent: Record<string, unknown>,
  rubricText: string | null,
  rubricFilename: string,
  rubricContentType: string,
) {
  if (!rubricText) return;

  caseContent.rubric_source = {
    filename: rubricFilename || null,
    mime_type: rubricContentType || null,
    uploaded_at: new Date().toISOString(),
    source_text: rubricText.slice(0, 25000),
  };
}

export default defineEventHandler(async (event) => {
  const pipelineStart = Date.now();
  log("START", "=== Case Upload Pipeline Started ===");

  // ── Auth ──────────────────────────────────────────────────────────
  log("AUTH", "Verifying user authentication...");
  const user = await serverSupabaseUser(event);
  const client = await serverSupabaseClient(event);

  // @ts-ignore – Supabase user shape varies
  const userId = user?.id || user?.sub;
  if (!userId) {
    log("AUTH", "FAILED — no user ID found");
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  log("AUTH", `User authenticated: ${userId}`);

  // Verify ADMIN role
  const { data: userProfile, error: profileError } = (await client
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError || !userProfile) {
    log("AUTH", "FAILED — user profile not found");
    throw createError({
      statusCode: 403,
      message: "Forbidden: User profile not found",
    });
  }

  if (userProfile.role?.toUpperCase() !== "ADMIN") {
    log("AUTH", `FAILED — role is "${userProfile.role}", need ADMIN`);
    throw createError({
      statusCode: 403,
      message: "Forbidden: Only admins can create cases",
    });
  }
  log("AUTH", "Admin role verified");

  // Service role client bypasses RLS — safe since we already verified ADMIN role
  const serviceClient = serverSupabaseServiceRole(event);

  // ── Parse multipart form data ────────────────────────────────────
  log("PARSE", "Reading multipart form data...");
  const formData = await readMultipartFormData(event);
  if (!formData || formData.length === 0) {
    log("PARSE", "FAILED — no form data received");
    throw createError({
      statusCode: 400,
      message: "No form data received. Please upload a PDF file with case details.",
    });
  }

  let caseFileBuffer: Buffer | null = null;
  let caseFilename = "";
  let caseContentType = "";
  let caseName = "";
  let caseDescription = "";
  let rubricBuffer: Buffer | null = null;
  let rubricFilename = "";
  let rubricContentType = "";

  for (const part of formData) {
    if (part.name === "file" && part.data) {
      caseFileBuffer = part.data as Buffer;
      caseFilename = part.filename ?? "";
      caseContentType = part.type ?? "";
    } else if (part.name === "caseName" && part.data) {
      caseName = part.data.toString("utf-8").trim();
    } else if (part.name === "caseDescription" && part.data) {
      caseDescription = part.data.toString("utf-8").trim();
    } else if (part.name === "rubricFile" && part.data) {
      rubricBuffer = part.data as Buffer;
      rubricFilename = part.filename ?? "";
      rubricContentType = part.type ?? "";
    }
  }

  log("PARSE", `Form data parsed — caseName: "${caseName}", description length: ${caseDescription.length}, file size: ${caseFileBuffer?.length ?? 0} bytes`);

  // ── Input validation ─────────────────────────────────────────────
  if (!caseFileBuffer || caseFileBuffer.length === 0) {
    log("VALIDATE", "FAILED — no case file");
    throw createError({ statusCode: 400, message: "A PDF or DOCX case file is required." });
  }

  if (caseFileBuffer.length > MAX_PDF_SIZE_BYTES) {
    log("VALIDATE", `FAILED — case file too large: ${caseFileBuffer.length} bytes`);
    throw createError({
      statusCode: 400,
      message: `Case file too large. Maximum size is ${MAX_PDF_SIZE_BYTES / (1024 * 1024)} MB.`,
    });
  }

  if (!caseName) {
    throw createError({ statusCode: 400, message: "Case name is required." });
  }

  if (!caseDescription) {
    throw createError({ statusCode: 400, message: "Case description is required." });
  }

  if (rubricBuffer && rubricBuffer.length > MAX_RUBRIC_SIZE_BYTES) {
    log("VALIDATE", `FAILED — rubric too large: ${rubricBuffer.length} bytes`);
    throw createError({
      statusCode: 400,
      message: `Rubric file too large. Maximum size is ${MAX_RUBRIC_SIZE_BYTES / (1024 * 1024)} MB.`,
    });
  }

  log("VALIDATE", "All inputs validated");

  // ── Step 1: Extract case document text ────────────────────────────
  log("DOC", `Extracting text from "${caseFilename || "uploaded case"}"...`);
  const docStart = Date.now();
  let pdfText: string;
  try {
    pdfText = await extractDocumentText(
      caseFileBuffer,
      caseFilename,
      caseContentType,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log("DOC", `FAILED — ${msg}`);
    throw createError({
      statusCode: 422,
      message: `Failed to extract text from uploaded case file: ${msg}`,
    });
  }

  log("DOC", `Text extracted in ${Date.now() - docStart}ms — ${pdfText.length} characters`);
  log("DOC", `First 200 chars: ${pdfText.substring(0, 200).replace(/\n/g, " ")}...`);

  if (pdfText.length < 100) {
    log("DOC", "FAILED — too little text extracted");
    throw createError({
      statusCode: 422,
      message: "The uploaded case file contains too little text to generate a clinical case. Please upload a more detailed PDF or DOCX document.",
    });
  }

  // ── Step 1b: Extract optional rubric text ─────────────────────────
  let rubricText: string | null = null;
  if (rubricBuffer && rubricBuffer.length > 0) {
    log("RUBRIC", `Extracting rubric text from "${rubricFilename || "uploaded rubric"}"...`);
    try {
      rubricText = await extractUploadedText(
        rubricBuffer,
        rubricFilename,
        rubricContentType,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log("RUBRIC", `FAILED — ${msg}`);
      throw createError({
        statusCode: 422,
        message: `Failed to read rubric file: ${msg}`,
      });
    }

    if (rubricText.length < 40) {
      throw createError({
        statusCode: 422,
        message: "Rubric file contains too little text to use for grading guidance.",
      });
    }
  }

  // ── Step 2: Generate case content via AI (with validation retries) ──
  log("AI", `Starting AI case generation (max ${MAX_AI_RETRIES} attempts)...`);
  let caseContent: Record<string, unknown> | null = null;
  let lastAiError: string | null = null;
  let aiAttempts = 0;

  for (aiAttempts = 0; aiAttempts < MAX_AI_RETRIES; aiAttempts++) {
    const attemptStart = Date.now();
    log("AI", `--- Attempt ${aiAttempts + 1}/${MAX_AI_RETRIES} ---`);

    if (lastAiError) {
      log("AI", `Previous error being fed back: ${lastAiError.substring(0, 300)}`);
    }

    log("AI", "Calling OpenAI o4-mini... (this may take 30-60 seconds)");
    const result = await generateCaseContent(
      pdfText,
      caseName,
      caseDescription,
      lastAiError,
      rubricText
    );

    log("AI", `OpenAI responded in ${Date.now() - attemptStart}ms`);

    // If the AI call itself failed (network, API error, etc.)
    if (result.error && !result.content) {
      log("AI", `API/Parse error: ${result.error}`);
      lastAiError = result.error;
      continue;
    }

    log("AI", "Got JSON response, validating schema...");

    // Validate the generated JSON against our schema
    const validation = validateCaseSchema(result.content);

    if (validation.valid) {
      log("AI", "Schema validation PASSED");
      caseContent = result.content;
      break;
    }

    // Feed validation errors back for the next attempt
    log("AI", `Schema validation FAILED with ${validation.errors.length} error(s):`);
    for (const err of validation.errors) {
      log("AI", `  - ${err}`);
    }
    lastAiError = `Schema validation failed with ${validation.errors.length} error(s):\n${validation.errors.join("\n")}`;
    caseContent = null;
  }

  if (!caseContent) {
    log("AI", `GAVE UP after ${aiAttempts} attempt(s). Last error: ${lastAiError}`);
    throw createError({
      statusCode: 500,
      message: `Failed to generate valid case content after ${aiAttempts} attempt(s). Last error: ${lastAiError}`,
    });
  }

  log("AI", `Case content generated successfully in ${aiAttempts + 1} attempt(s)`);
  const contentKeys = Object.keys(caseContent);
  log("AI", `Content has ${contentKeys.length} top-level keys: ${contentKeys.join(", ")}`);

  attachRubricSource(caseContent, rubricText, rubricFilename, rubricContentType);

  // ── Step 3: Insert into database (with retry on DB errors) ───────
  log("DB", `Starting database insert (max ${MAX_DB_RETRIES} attempts)...`);
  let insertedCaseId: number | null = null;
  let lastDbError: string | null = null;

  for (let dbAttempt = 0; dbAttempt < MAX_DB_RETRIES; dbAttempt++) {
    log("DB", `--- DB attempt ${dbAttempt + 1}/${MAX_DB_RETRIES} ---`);

    // If this is a retry due to DB error, ask AI to fix the content
    if (lastDbError && dbAttempt > 0) {
      log("DB", `Previous DB error: ${lastDbError}`);
      log("DB", "Asking AI to fix content for PostgreSQL compatibility...");

      const fixResult = await generateCaseContent(
        pdfText,
        caseName,
        caseDescription,
        `Database insertion failed with error: ${lastDbError}. The JSON content may have invalid characters or structure for PostgreSQL JSONB. Please fix and regenerate.`,
        rubricText
      );

      if (fixResult.content) {
        const revalidation = validateCaseSchema(fixResult.content);
        if (revalidation.valid) {
          log("DB", "AI-fixed content passed validation, using it");
          caseContent = fixResult.content;
          attachRubricSource(
            caseContent,
            rubricText,
            rubricFilename,
            rubricContentType,
          );
        } else {
          log("DB", "AI-fixed content failed validation, keeping original");
        }
      }
    }

    log("DB", "Inserting into cases table...");

    // GUARDRAIL: The ONLY database operation — a safe parameterized INSERT
    // Uses service role client to bypass RLS (admin role already verified above)
    const { data, error: insertError } = (await serviceClient
      .from("cases")
      .insert({
        name: caseName,
        description: caseDescription,
        content: caseContent,
      } as any)
      .select("id")
      .single()) as { data: { id: number } | null; error: any };

    if (!insertError && data) {
      insertedCaseId = (data as { id: number }).id;
      log("DB", `INSERT SUCCESS — case ID: ${insertedCaseId}`);
      break;
    }

    lastDbError = insertError?.message ?? "Unknown database error";
    log("DB", `INSERT FAILED: ${lastDbError}`);
  }

  if (!insertedCaseId) {
    log("DB", `GAVE UP after ${MAX_DB_RETRIES} attempt(s). Last error: ${lastDbError}`);
    throw createError({
      statusCode: 500,
      message: `Failed to save case to database after ${MAX_DB_RETRIES} attempt(s). Last error: ${lastDbError}`,
    });
  }

  // ── Success ──────────────────────────────────────────────────────
  const totalTime = Date.now() - pipelineStart;
  log("DONE", `=== Pipeline completed in ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s) ===`);
  log("DONE", `Case "${caseName}" saved with ID ${insertedCaseId}`);

  return {
    success: true,
    caseId: insertedCaseId,
    message: `Case "${caseName}" created successfully.`,
    aiAttempts: aiAttempts + 1,
  };
});
