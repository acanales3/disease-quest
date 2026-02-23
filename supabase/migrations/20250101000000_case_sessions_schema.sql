-- Migration: Add case simulation infrastructure
-- Adds content JSONB column to cases table and creates session tracking tables

-- 1. Add content column to existing cases table
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS content jsonb;

-- 2. Case sessions table: tracks a student's active simulation
CREATE TABLE IF NOT EXISTS public.case_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(user_id),
  case_id bigint NOT NULL REFERENCES public.cases(id),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'in_progress', 'completed', 'abandoned')),
  phase text NOT NULL DEFAULT 'prologue'
    CHECK (phase IN ('prologue', 'prep_huddle', 'active_encounter', 'debrief', 'reflection', 'completed')),
  elapsed_minutes real DEFAULT 0,
  unlocked_disclosures text[] DEFAULT '{}',
  patient_state jsonb DEFAULT '{}',
  differential_history jsonb DEFAULT '[]',
  final_diagnosis jsonb,
  management_plan jsonb DEFAULT '[]',
  scoring jsonb DEFAULT '{}',
  flags jsonb DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Session messages table: conversation history per agent
CREATE TABLE IF NOT EXISTS public.session_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.case_sessions(id) ON DELETE CASCADE,
  role text NOT NULL
    CHECK (role IN ('student', 'patient', 'tutor', 'system', 'diagnostic', 'evaluator')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 4. Session actions table: action log for evaluation
CREATE TABLE IF NOT EXISTS public.session_actions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.case_sessions(id) ON DELETE CASCADE,
  actor text NOT NULL,
  action_type text NOT NULL
    CHECK (action_type IN ('ask', 'order_test', 'perform_exam', 'administer', 'consult', 'interpret', 'diagnose', 'differential', 'note')),
  target text,
  payload jsonb DEFAULT '{}',
  response jsonb DEFAULT '{}',
  points_earned integer DEFAULT 0,
  penalties integer DEFAULT 0,
  elapsed_minutes real DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_sessions_student_id ON public.case_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_case_sessions_case_id ON public.case_sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_sessions_status ON public.case_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON public.session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_actions_session_id ON public.session_actions(session_id);

-- 6. RLS policies
ALTER TABLE public.case_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_actions ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own sessions
CREATE POLICY "Students can view own sessions"
  ON public.case_sessions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create own sessions"
  ON public.case_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own sessions"
  ON public.case_sessions FOR UPDATE
  USING (auth.uid() = student_id);

-- Students can read/write messages in their own sessions
CREATE POLICY "Students can view own session messages"
  ON public.session_messages FOR SELECT
  USING (session_id IN (SELECT id FROM public.case_sessions WHERE student_id = auth.uid()));

CREATE POLICY "Students can create messages in own sessions"
  ON public.session_messages FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.case_sessions WHERE student_id = auth.uid()));

-- Students can view actions in their own sessions
CREATE POLICY "Students can view own session actions"
  ON public.session_actions FOR SELECT
  USING (session_id IN (SELECT id FROM public.case_sessions WHERE student_id = auth.uid()));

CREATE POLICY "Students can create actions in own sessions"
  ON public.session_actions FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM public.case_sessions WHERE student_id = auth.uid()));

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access on case_sessions"
  ON public.case_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on session_messages"
  ON public.session_messages FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on session_actions"
  ON public.session_actions FOR ALL
  USING (auth.role() = 'service_role');

-- Instructors/admins can view sessions for students in their classrooms
CREATE POLICY "Instructors can view classroom student sessions"
  ON public.case_sessions FOR SELECT
  USING (
    student_id IN (
      SELECT cs.student_id FROM public.classroom_students cs
      JOIN public.classrooms c ON c.id = cs.classroom_id
      WHERE c.instructor_id = auth.uid()
    )
  );
