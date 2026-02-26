import { defineEventHandler, readBody, createError } from "h3"
import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)
    const body = await readBody(event)

    const { classroomId, caseIds } = body

    // ✅ validate input
    if (!classroomId || !Array.isArray(caseIds) || caseIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "classroomId and caseIds[] are required",
      })
    }

    const classroom_id = Number(classroomId)
    const case_ids = caseIds.map((id: any) => Number(id))

    // ensure valid numbers
    if (isNaN(classroom_id) || case_ids.some(isNaN)) {
      throw createError({
        statusCode: 400,
        message: "Invalid classroomId or caseIds",
      })
    }

    // ✅ check which already exist (avoid duplicates)
    const { data: existing, error: existingError } = await client
      .from("classroom_cases")
      .select("case_id")
      .eq("classroom_id", classroom_id)
      .in("case_id", case_ids)

    if (existingError) {
      throw createError({
        statusCode: 500,
        message: existingError.message,
      })
    }

    // filter out duplicates
    const existingIds = new Set(existing?.map((e) => e.case_id) || [])
    const newCaseIds = case_ids.filter((id) => !existingIds.has(id))

    if (newCaseIds.length === 0) {
      throw createError({
        statusCode: 409,
        message: "All selected cases are already assigned to this classroom",
      })
    }

    // ✅ bulk insert
    const rowsToInsert = newCaseIds.map((case_id) => ({
      classroom_id,
      case_id,
    }))

    const { data, error } = await client
      .from("classroom_cases")
      .insert(rowsToInsert)
      .select()

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      })
    }

    return {
      success: true,
      inserted: data.length,
      data,
    }
  } catch (err) {
    throw err
  }
})