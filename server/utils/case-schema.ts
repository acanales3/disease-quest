/**
 * Case JSON Schema Validator
 *
 * Validates the AI-generated case content against the expected schema
 * derived from the Amelia Thompson case structure.
 * Returns a list of validation errors (empty = valid).
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isNonEmptyArray(v: unknown): v is unknown[] {
  return Array.isArray(v) && v.length > 0;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ---------------------------------------------------------------------------
// Top-level required string fields
// ---------------------------------------------------------------------------
const REQUIRED_STRING_FIELDS = [
  "schema_version",
  "case_id",
  "title",
  "setting",
  "difficulty",
  "correct_diagnosis",
] as const;

// Top-level required array fields (must be non-empty arrays)
const REQUIRED_ARRAY_FIELDS = [
  "learner_level",
  "core_skills",
  "key_findings",
  "success_conditions",
  "failure_conditions",
  "learning_objectives",
  "disclosures",
  "diagnostic_tests",
  "interventions",
  "evaluation_rubrics",
  "deterioration_rules",
] as const;

// Top-level required object fields
const REQUIRED_OBJECT_FIELDS = [
  "initial_vitals",
  "initial_patient_state",
  "introduction",
  "test_results",
  "scoring_categories",
] as const;

// ---------------------------------------------------------------------------
// Vitals required numeric keys
// ---------------------------------------------------------------------------
const VITALS_REQUIRED_KEYS = [
  "temp_f",
  "bp_systolic",
  "bp_diastolic",
  "hr_bpm",
  "rr_bpm",
  "spo2_percent",
] as const;

// ---------------------------------------------------------------------------
// Patient state required keys
// ---------------------------------------------------------------------------
const PATIENT_STATE_REQUIRED_KEYS = [
  "patient_id",
  "name",
  "chief_complaint",
  "history_of_present_illness",
] as const;

// ---------------------------------------------------------------------------
// Evaluation rubric required keys
// ---------------------------------------------------------------------------
const RUBRIC_REQUIRED_KEYS = ["id", "name", "max_points"] as const;

// ---------------------------------------------------------------------------
// Main Validator
// ---------------------------------------------------------------------------

export function validateCaseSchema(content: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(content)) {
    return { valid: false, errors: ["Content must be a JSON object"] };
  }

  const c = content as Record<string, unknown>;

  // ------ Required string fields ------
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(c[field])) {
      errors.push(`Missing or empty required string field: "${field}"`);
    }
  }

  // ------ estimated_minutes (number) ------
  if (typeof c.estimated_minutes !== "number" || c.estimated_minutes <= 0) {
    errors.push(
      `"estimated_minutes" must be a positive number, got: ${c.estimated_minutes}`
    );
  }

  // ------ Required non-empty arrays ------
  for (const field of REQUIRED_ARRAY_FIELDS) {
    if (!isNonEmptyArray(c[field])) {
      errors.push(`Missing or empty required array field: "${field}"`);
    }
  }

  // ------ Required object fields ------
  for (const field of REQUIRED_OBJECT_FIELDS) {
    if (!isObject(c[field])) {
      errors.push(`Missing or invalid required object field: "${field}"`);
    }
  }

  // Stop early if fundamental structure is broken
  if (errors.length > 5) {
    return { valid: false, errors };
  }

  // ------ initial_vitals deep check ------
  if (isObject(c.initial_vitals)) {
    const v = c.initial_vitals as Record<string, unknown>;
    for (const key of VITALS_REQUIRED_KEYS) {
      if (typeof v[key] !== "number") {
        errors.push(`initial_vitals.${key} must be a number`);
      }
    }
  }

  // ------ introduction deep check ------
  if (isObject(c.introduction)) {
    const intro = c.introduction as Record<string, unknown>;
    if (!isNonEmptyArray(intro.paragraphs)) {
      errors.push(
        'introduction.paragraphs must be a non-empty array of strings'
      );
    }
    if (!isNonEmptyArray(intro.instructions)) {
      errors.push(
        'introduction.instructions must be a non-empty array of strings'
      );
    }
  }

  // ------ initial_patient_state deep check ------
  if (isObject(c.initial_patient_state)) {
    const ps = c.initial_patient_state as Record<string, unknown>;
    for (const key of PATIENT_STATE_REQUIRED_KEYS) {
      if (!isNonEmptyString(ps[key])) {
        errors.push(
          `initial_patient_state.${key} must be a non-empty string`
        );
      }
    }
    // physiology sub-object
    if (!isObject(ps.physiology)) {
      errors.push("initial_patient_state.physiology must be an object");
    }
  }

  // ------ learning_objectives items ------
  if (isNonEmptyArray(c.learning_objectives)) {
    for (let i = 0; i < (c.learning_objectives as unknown[]).length; i++) {
      const lo = (c.learning_objectives as unknown[])[i];
      if (!isObject(lo)) {
        errors.push(`learning_objectives[${i}] must be an object`);
        continue;
      }
      const obj = lo as Record<string, unknown>;
      if (!isNonEmptyString(obj.id))
        errors.push(`learning_objectives[${i}].id is missing`);
      if (!isNonEmptyString(obj.text))
        errors.push(`learning_objectives[${i}].text is missing`);
    }
  }

  // ------ disclosures items ------
  if (isNonEmptyArray(c.disclosures)) {
    for (let i = 0; i < (c.disclosures as unknown[]).length; i++) {
      const d = (c.disclosures as unknown[])[i];
      if (!isObject(d)) {
        errors.push(`disclosures[${i}] must be an object`);
        continue;
      }
      const obj = d as Record<string, unknown>;
      if (!isNonEmptyString(obj.id))
        errors.push(`disclosures[${i}].id is missing`);
      if (!isNonEmptyString(obj.title))
        errors.push(`disclosures[${i}].title is missing`);
      if (!isObject(obj.unlock))
        errors.push(`disclosures[${i}].unlock must be an object`);
      if (!isObject(obj.content))
        errors.push(`disclosures[${i}].content must be an object`);
      if (!isNonEmptyArray(obj.maps_to_objectives))
        errors.push(
          `disclosures[${i}].maps_to_objectives must be a non-empty array`
        );
    }
  }

  // ------ diagnostic_tests items ------
  if (isNonEmptyArray(c.diagnostic_tests)) {
    for (let i = 0; i < (c.diagnostic_tests as unknown[]).length; i++) {
      const t = (c.diagnostic_tests as unknown[])[i];
      if (!isObject(t)) {
        errors.push(`diagnostic_tests[${i}] must be an object`);
        continue;
      }
      const obj = t as Record<string, unknown>;
      if (!isNonEmptyString(obj.id))
        errors.push(`diagnostic_tests[${i}].id is missing`);
      if (!isNonEmptyString(obj.display_name))
        errors.push(`diagnostic_tests[${i}].display_name is missing`);
    }
  }

  // ------ test_results keys should match diagnostic_tests ids ------
  if (isObject(c.test_results) && isNonEmptyArray(c.diagnostic_tests)) {
    const testIds = (c.diagnostic_tests as Record<string, unknown>[]).map(
      (t) => t.id as string
    );
    const resultKeys = Object.keys(c.test_results as Record<string, unknown>);
    for (const id of testIds) {
      if (!resultKeys.includes(id)) {
        errors.push(
          `test_results is missing an entry for diagnostic test "${id}"`
        );
      }
    }
  }

  // ------ evaluation_rubrics items ------
  if (isNonEmptyArray(c.evaluation_rubrics)) {
    for (let i = 0; i < (c.evaluation_rubrics as unknown[]).length; i++) {
      const r = (c.evaluation_rubrics as unknown[])[i];
      if (!isObject(r)) {
        errors.push(`evaluation_rubrics[${i}] must be an object`);
        continue;
      }
      const obj = r as Record<string, unknown>;
      for (const key of RUBRIC_REQUIRED_KEYS) {
        if (obj[key] === undefined || obj[key] === null) {
          errors.push(`evaluation_rubrics[${i}].${key} is missing`);
        }
      }
    }
  }

  // ------ scoring_categories check ------
  if (isObject(c.scoring_categories)) {
    const cats = c.scoring_categories as Record<string, unknown>;
    if (Object.keys(cats).length === 0) {
      errors.push("scoring_categories must have at least one category");
    }
    for (const [catName, catVal] of Object.entries(cats)) {
      if (!isObject(catVal)) {
        errors.push(`scoring_categories.${catName} must be an object`);
        continue;
      }
      const cat = catVal as Record<string, unknown>;
      if (typeof cat.max_points !== "number") {
        errors.push(
          `scoring_categories.${catName}.max_points must be a number`
        );
      }
      if (!isNonEmptyArray(cat.rules)) {
        errors.push(
          `scoring_categories.${catName}.rules must be a non-empty array`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
