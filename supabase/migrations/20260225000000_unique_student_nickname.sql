-- Migration: Add unique constraint on students.nickname
-- Ensures no two students can share the same nickname on the leaderboard.

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_nickname_unique
  ON public.students (nickname)
  WHERE nickname IS NOT NULL;
