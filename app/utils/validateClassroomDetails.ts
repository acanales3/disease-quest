/**
 * validateClassroomDetails
 *
 * Client-side validation for the Create Classroom form.
 * Validates all required fields and the Start Date ≤ End Date constraint.
 *
 * Required: Course Title, Course Code, Section, Term, Start Date, End Date
 * Dates:    Start Date ≤ End Date
 */

export interface ClassroomFormData {
  name: string
  code: string
  section: string
  term: string
  startDate: string
  endDate: string
}

export type ClassroomFormErrors = Partial<Record<keyof ClassroomFormData, string>>

export interface ClassroomValidationSuccess {
  success: true
  data: ClassroomFormData
}

export interface ClassroomValidationFailure {
  success: false
  errors: ClassroomFormErrors
}

export type ClassroomValidationResult =
  | ClassroomValidationSuccess
  | ClassroomValidationFailure

// ── Field labels (used in error messages) ───────────────────────────────────

const FIELD_LABELS: Record<keyof ClassroomFormData, string> = {
  name: 'Course Title',
  code: 'Course Code',
  section: 'Section',
  term: 'Term',
  startDate: 'Start Date',
  endDate: 'End Date',
}

// ── Validator ───────────────────────────────────────────────────────────────

export function validateClassroomDetails(
  input: ClassroomFormData,
): ClassroomValidationResult {
  const errors: ClassroomFormErrors = {}

  // Required-field checks
  const requiredFields: (keyof ClassroomFormData)[] = [
    'name',
    'code',
    'section',
    'term',
    'startDate',
    'endDate',
  ]

  for (const field of requiredFields) {
    const value = input[field]
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      errors[field] = `${FIELD_LABELS[field]} is required.`
    }
  }

  // Date range: Start Date ≤ End Date (only when both dates are present)
  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    if (start > end) {
      errors.endDate = 'End Date must be on or after Start Date.'
    }
  }

  // Return errors if any field failed
  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  // All fields valid — return trimmed values
  return {
    success: true,
    data: {
      name: input.name.trim(),
      code: input.code.trim(),
      section: input.section.trim(),
      term: input.term.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
    },
  }
}
