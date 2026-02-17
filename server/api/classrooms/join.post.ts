import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server';
import type { Database } from '@/assets/types/supabase'

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody<{ inviteCode: string}>(event);

    if (!body?.inviteCode) {
        throw createError({ statusCode: 400, statusMessage: "Invite code required" });
    }

    const supabase = await serverSupabaseClient<Database>(event);

    // Check user is a STUDENT
    const { data: student } = await supabase
        .from("students")
        .select("user_id")
        .eq("user_id", user.sub)
        .single();

    if (!student) {
        throw createError({ statusCode: 403, statusMessage: "Only students can join classrooms" });
    }

    // Find classroom
    const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id, name, status, invitation_code")
        .eq("invitation_code", body.inviteCode)
        .single()
    

    if (classroomError || !classroom) {
        throw createError({
            statusCode: 404,
            statusMessage: "Invalid invitation code"
        });
    }

    if (classroom.status !== "active") {
        throw createError({
            statusCode: 400,
            statusMessage: "This classroom is no longer active"
        })
    }

    // Prevent duplicate enrollment
    const { data: existing } = await supabase
        .from("classroom_students")
        .select("*")
        .eq("classroom_id", classroom.id)
        .eq("student_id", user.sub)
        .maybeSingle();

    if (existing) {
        throw createError({
            statusCode: 400,
            statusMessage: "You are already enrolled in this classroom",
        });
    }

    // Post enrollment
    const { error: insertError } = await supabase
        .from("classroom_students")
        .insert({
            classroom_id: classroom.id,
            student_id: user.sub,
        });

        if (insertError) {
            throw createError({
                statusCode: 500,
                statusMessage: "Failed to enroll in classroom"
            });
        }

        return { classroomId: classroom.id, classroomName: classroom.name };
});