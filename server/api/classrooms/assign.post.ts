import { defineEventHandler, readBody, createError } from "h3"
import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)
    const body = await readBody(event)

    const { classroomId, caseId } = body

    if (!classroomId || !caseId) {
      throw createError({
        statusCode: 400,
        message: "classroomId and caseId are required",
      })
    }

    const classroom_id = Number(classroomId)
    const case_id = Number(caseId)

    // check duplicate
    const { data: existing, error: existingError } = await client
      .from("classroom_cases")
      .select("id")
      .eq("classroom_id", classroom_id)
      .eq("case_id", case_id)
      .maybeSingle()

    if (existingError) {
      throw createError({ statusCode: 500, message: existingError.message })
    }

    if (existing) {
      throw createError({
        statusCode: 409,
        message: "Case already assigned",
      })
    }

    // insert
    const { data, error } = await client
      .from("classroom_cases")
      .insert([
        {
          classroom_id,
          case_id,
        },
      ] as any)
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      })
    }

    return data
  } catch (err) {
    throw err
  }
})