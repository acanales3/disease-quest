/**
 * Seed students into Supabase Auth + public.users + public.students + public.classroom_students
 * Run:
 *      npx ts-node scripts/seed-students.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

type StudentMock = {
    id: number; // mock-only
    name: string;
    nickname: string;
    email: string;
    school: string;
    msyear: number;
    classroom: number; // maps to classroom_students.classroom_id
    status: "registered" | "unregistered"; // must match public.student_status enum labels
};

const students: StudentMock[] = [
    {
        id: 0,
        name: "Alex Johnson",
        nickname: "Alex",
        email: "student0@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 1,
        status: "registered",
    },
    {
        id: 1,
        name: "Jamie Smith",
        nickname: "Jamie",
        email: "student1@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 2,
        name: "Taylor Wilson",
        nickname: "Taylor",
        email: "student2@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 1,
        status: "registered",
    },
    {
        id: 3,
        name: "Casey Brown",
        nickname: "Casey",
        email: "student3@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 3,
        status: "unregistered",
    },
    {
        id: 4,
        name: "Jordan Taylor",
        nickname: "Jordan",
        email: "student4@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 2,
        status: "registered",
    },
    {
        id: 5,
        name: "Morgan Martinez",
        nickname: "Morgan",
        email: "student5@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 3,
        status: "registered",
    },
    {
        id: 6,
        name: "Riley Anderson",
        nickname: "Riley",
        email: "student6@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 3,
        status: "unregistered",
    },
    {
        id: 7,
        name: "Avery Thomas",
        nickname: "Avery",
        email: "student7@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 5,
        status: "registered",
    },
    {
        id: 8,
        name: "Quinn Hernandez",
        nickname: "Quinn",
        email: "student8@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 4,
        status: "registered",
    },
    {
        id: 9,
        name: "Peyton Moore",
        nickname: "Peyton",
        email: "student9@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 5,
        status: "unregistered",
    },
    {
        id: 10,
        name: "Skyler Martin",
        nickname: "Skyler",
        email: "student10@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 4,
        status: "registered",
    },
    {
        id: 11,
        name: "Dakota Jackson",
        nickname: "Dakota",
        email: "student11@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 3,
        status: "registered",
    },
    {
        id: 12,
        name: "Cameron Thompson",
        nickname: "Cameron",
        email: "student12@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 1,
        status: "unregistered",
    },
    {
        id: 13,
        name: "Blake White",
        nickname: "Blake",
        email: "student13@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 4,
        status: "registered",
    },
    {
        id: 14,
        name: "Hayden Lopez",
        nickname: "Hayden",
        email: "student14@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 2,
        status: "registered",
    },
    {
        id: 15,
        name: "Reese Lee",
        nickname: "Reese",
        email: "student15@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 1,
        status: "unregistered",
    },
    {
        id: 16,
        name: "Spencer Gonzalez",
        nickname: "Spencer",
        email: "student16@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 3,
        status: "registered",
    },
    {
        id: 17,
        name: "Sage Harris",
        nickname: "Sage",
        email: "student17@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 2,
        status: "registered",
    },
    {
        id: 18,
        name: "Finley Clark",
        nickname: "Finley",
        email: "student18@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 4,
        status: "unregistered",
    },
    {
        id: 19,
        name: "Rowan Lewis",
        nickname: "Rowan",
        email: "student19@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 1,
        status: "registered",
    },
    {
        id: 20,
        name: "Elliot Robinson",
        nickname: "Elliot",
        email: "student20@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 3,
        status: "registered",
    },
    {
        id: 21,
        name: "Charlie Walker",
        nickname: "Charlie",
        email: "student21@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 22,
        name: "Emerson Perez",
        nickname: "Emerson",
        email: "student22@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 1,
        status: "registered",
    },
    {
        id: 23,
        name: "Sawyer Hall",
        nickname: "Sawyer",
        email: "student23@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 4,
        status: "registered",
    },
    {
        id: 24,
        name: "Avery King",
        nickname: "Avery",
        email: "student24@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 25,
        name: "Riley Scott",
        nickname: "Riley",
        email: "student25@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 1,
        status: "registered",
    },
    {
        id: 26,
        name: "Quinn Young",
        nickname: "Quinn",
        email: "student26@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 3,
        status: "registered",
    },
    {
        id: 27,
        name: "Peyton Allen",
        nickname: "Peyton",
        email: "student27@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 28,
        name: "Skyler Wright",
        nickname: "Skyler",
        email: "student28@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 1,
        status: "registered",
    },
    {
        id: 29,
        name: "Dakota Torres",
        nickname: "Dakota",
        email: "student29@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 3,
        status: "registered",
    },
    {
        id: 30,
        name: "Cameron Nguyen",
        nickname: "Cameron",
        email: "student30@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 31,
        name: "Blake Hill",
        nickname: "Blake",
        email: "student31@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 1,
        status: "registered",
    },
    {
        id: 32,
        name: "Hayden Flores",
        nickname: "Hayden",
        email: "student32@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 3,
        status: "registered",
    },
    {
        id: 33,
        name: "Reese Green",
        nickname: "Reese",
        email: "student33@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 34,
        name: "Spencer Adams",
        nickname: "Spencer",
        email: "student34@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 1,
        status: "registered",
    },
    {
        id: 35,
        name: "Sage Nelson",
        nickname: "Sage",
        email: "student35@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 4,
        status: "registered",
    },
    {
        id: 36,
        name: "Finley Baker",
        nickname: "Finley",
        email: "student36@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 37,
        name: "Rowan Hall",
        nickname: "Rowan",
        email: "student37@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 1,
        status: "registered",
    },
    {
        id: 38,
        name: "Elliot Rivera",
        nickname: "Elliot",
        email: "student38@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 3,
        status: "registered",
    },
    {
        id: 39,
        name: "Charlie Campbell",
        nickname: "Charlie",
        email: "student39@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 40,
        name: "Emerson Mitchell",
        nickname: "Emerson",
        email: "student40@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 1,
        status: "registered",
    },
    {
        id: 41,
        name: "Sawyer Carter",
        nickname: "Sawyer",
        email: "student41@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 4,
        status: "registered",
    },
    {
        id: 42,
        name: "Jordan Roberts",
        nickname: "Jordan",
        email: "student42@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 43,
        name: "Morgan Phillips",
        nickname: "Morgan",
        email: "student43@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 1,
        status: "registered",
    },
    {
        id: 44,
        name: "Riley Evans",
        nickname: "Riley",
        email: "student44@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 3,
        status: "registered",
    },
    {
        id: 45,
        name: "Avery Turner",
        nickname: "Avery",
        email: "student45@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 46,
        name: "Quinn Parker",
        nickname: "Quinn",
        email: "student46@tcu.edu",
        school: "Texas Christian University",
        msyear: 3,
        classroom: 1,
        status: "registered",
    },
    {
        id: 47,
        name: "Peyton Collins",
        nickname: "Peyton",
        email: "student47@tcu.edu",
        school: "Texas Christian University",
        msyear: 4,
        classroom: 4,
        status: "registered",
    },
    {
        id: 48,
        name: "Skyler Stewart",
        nickname: "Skyler",
        email: "student48@tcu.edu",
        school: "Texas Christian University",
        msyear: 1,
        classroom: 2,
        status: "unregistered",
    },
    {
        id: 49,
        name: "Dakota Morris",
        nickname: "Dakota",
        email: "student49@tcu.edu",
        school: "Texas Christian University",
        msyear: 2,
        classroom: 1,
        status: "registered",
    },
];

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const DEFAULT_PASSWORD = "123";

const USER_ROLE_STUDENT = "STUDENT";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// naive full-name split
function splitName(full: string) {
    const parts = full.trim().split(/\s+/);
    const first_name = parts[0] ?? null;
    const last_name = parts.length > 1 ? parts.slice(1).join(" ") : null;
    return { first_name, last_name };
}

async function getAuthUserIdByEmail(email: string): Promise<string | null> {
    // listUsers is fine for small seeds (50). If you have thousands, do paging.
    const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 2000,
    });
    if (error) throw error;

    const u = data.users.find((x) => (x.email || "").toLowerCase() === email.toLowerCase());
    return u?.id ?? null;
}

async function ensureAuthUser(email: string) {
    const existingId = await getAuthUserIdByEmail(email);
    if (existingId) return existingId;

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
    });
    if (error) throw error;
    if (!data.user?.id) throw new Error(`Auth user created but missing id for ${email}`);
    return data.user.id;
}

async function assertClassroomsExist(classroomIds: number[]) {
    const unique = [...new Set(classroomIds)];

    const { data, error } = await supabase.from("classrooms").select("id").in("id", unique);
    if (error) throw error;

    const found = new Set((data ?? []).map((r: any) => Number(r.id)));
    const missing = unique.filter((id) => !found.has(id));

    if (missing.length) {
        throw new Error(
            `Missing classrooms in public.classrooms for ids: ${missing.join(
                ", "
            )}. Create these classroom rows first (or change mock data).`
        );
    }
}

async function main() {
    console.log(`Seeding ${students.length} students...`);

    // Ensure classroom FK targets exist
    await assertClassroomsExist(students.map((s) => s.classroom));

    let ok = 0;
    let failed = 0;

    for (const s of students) {
        try {
            // 1) Auth user UUID
            const userId = await ensureAuthUser(s.email);

            const { first_name, last_name } = splitName(s.name);

            // 2) public.users (FK -> auth.users)
            // Use email unique constraint for idempotent reruns
            const { error: usersErr } = await supabase
                .from("users")
                .upsert(
                    {
                        id: userId,
                        first_name,
                        last_name,
                        name: s.name,
                        email: s.email,
                        school: s.school,
                        role: USER_ROLE_STUDENT,
                    },
                    { onConflict: "email" }
                );
            if (usersErr) throw usersErr;

            // 3) public.students (PK user_id)
            const { error: studentsErr } = await supabase
                .from("students")
                .upsert(
                    {
                        user_id: userId,
                        nickname: s.nickname,
                        msyear: s.msyear,
                        status: s.status,
                    },
                    { onConflict: "user_id" }
                );
            if (studentsErr) throw studentsErr;

            // 4) classroom_students join table
            const { error: joinErr } = await supabase
                .from("classroom_students")
                .upsert(
                    {
                        classroom_id: s.classroom,
                        student_id: userId,
                        // enrolled_at left to default now()
                    },
                    { onConflict: "classroom_id,student_id" }
                );
            if (joinErr) throw joinErr;

            ok++;
            console.log(`✅ ${s.email} -> ${userId} (classroom ${s.classroom})`);
        } catch (e: any) {
            failed++;
            console.error(`❌ ${s.email}: ${e?.message ?? e}`);
        }
    }

    console.log(`Done. Success: ${ok}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});