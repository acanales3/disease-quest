import { defineEventHandler, createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const client = await serverSupabaseClient(event)

  // @ts-ignore
  const userId = user?.id || user?.sub

  if (!userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { data: userProfile, error: profileError } = await client
    .from('users')
    .select('role')
    .eq('id', userId)
    .single() as { data: { role: string } | null, error: any }

  if (profileError || !userProfile) {
    throw createError({ statusCode: 403, message: 'Forbidden: User profile not found' })
  }

  const role = userProfile.role?.toUpperCase()

  // ADMIN / INSTRUCTOR: all cases
  if (role === 'ADMIN' || role === 'INSTRUCTOR') {
    const { data, error } = await client
      .from('cases')
      .select('id, name, description, created_at')
      .order('id', { ascending: true })

    if (error) {
      throw createError({ statusCode: 500, message: error.message })
    }

    return data ?? []
  }

  // STUDENT: cases assigned to classrooms they are enrolled in + progress from student_cases
  if (role === 'STUDENT') {
    // 1) student classroom memberships
    const { data: memberships, error: mErr } = await client
      .from('classroom_students')
      .select('classroom_id')
      .eq('student_id', userId)

    if (mErr) {
      throw createError({ statusCode: 500, message: mErr.message })
    }

    const classroomIds = (memberships ?? []).map((m: any) => m.classroom_id)
    if (classroomIds.length === 0) return []

    // 2) cases for those classrooms
    const { data: rows, error: ccErr } = await client
      .from('classroom_cases')
      .select(`
        classroom_id,
        case_id,
        cases (
          id, name, description, created_at
        )
      `)
      .in('classroom_id', classroomIds)

    if (ccErr) {
      throw createError({ statusCode: 500, message: ccErr.message })
    }

    // Flatten + dedupe + remember a classroom for display
    const byCaseId = new Map<number, any>()
    for (const r of rows ?? []) {
      const c = (r as any).cases
      if (!c) continue
      const caseId = c.id as number
      if (!byCaseId.has(caseId)) {
        byCaseId.set(caseId, {
          id: c.id,
          name: c.name,
          description: c.description,
          created_at: c.created_at,
          classroom: (r as any).classroom_id, // for now: classroom id
        })
      }
    }

    const caseIds = Array.from(byCaseId.keys())
    if (caseIds.length === 0) return []

    // 3) progress for this student for those cases
    const { data: progress, error: pErr } = await client
      .from('student_cases')
      .select('case_id, started_at, completed_at')
      .eq('student_id', userId)
      .in('case_id', caseIds)

    if (pErr) {
      throw createError({ statusCode: 500, message: pErr.message })
    }

    const progressByCase = new Map<number, { started_at: any; completed_at: any }>()
    for (const p of progress ?? []) {
      progressByCase.set((p as any).case_id, {
        started_at: (p as any).started_at,
        completed_at: (p as any).completed_at,
      })
    }

    // 4) shape to match student datatable columns
    const result = caseIds.map((id) => {
      const base = byCaseId.get(id)
      const prog = progressByCase.get(id)

      let status: 'not started' | 'in progress' | 'completed' = 'not started'
      if (prog?.completed_at) status = 'completed'
      else if (prog?.started_at) status = 'in progress'

      return {
        ...base,
        status,
        completionDate: prog?.completed_at ?? null,
      }
    })

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return result
  }

  return []
})
