-- Fix score columns: remove numeric(4,3) precision constraint
-- Rubric scores can be 0-15, so unrestricted numeric is needed
ALTER TABLE public.evaluations 
  ALTER COLUMN history_taking_synthesis TYPE numeric,
  ALTER COLUMN physical_exam_interpretation TYPE numeric,
  ALTER COLUMN differential_diagnosis_formulation TYPE numeric,
  ALTER COLUMN diagnostic_tests TYPE numeric,
  ALTER COLUMN management_reasoning TYPE numeric,
  ALTER COLUMN communication_empathy TYPE numeric,
  ALTER COLUMN reflection_metacognition TYPE numeric;
