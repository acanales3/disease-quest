-- Drop the overly restrictive score_range check constraint
-- Scores of 0 are valid (student can earn 0 on a competency)
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_score_range;
