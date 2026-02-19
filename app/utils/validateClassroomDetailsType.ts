/**
 * validateClassroomDetailsType
 *
 * Reusable type-check validator for ClassroomName and ClassroomDescription.
 * Ensures both fields are of the correct type (string).
 *
 * Can be used during classroom creation or classroom detail editing.
 */

export interface ClassroomDetailsTypeInput {
  classroomName: unknown
  classroomDescription: unknown
}

export interface ClassroomDetailsTypeErrors {
  classroomName?: string
  classroomDescription?: string
}

export interface ClassroomDetailsTypeSuccess {
  success: true
  data: {
    classroomName: string
    classroomDescription: string
  }
}

export interface ClassroomDetailsTypeFailure {
  success: false
  errors: ClassroomDetailsTypeErrors
}

export type ClassroomDetailsTypeResult =
  | ClassroomDetailsTypeSuccess
  | ClassroomDetailsTypeFailure

export function validateClassroomDetailsType(
  input: ClassroomDetailsTypeInput,
): ClassroomDetailsTypeResult {
  const errors: ClassroomDetailsTypeErrors = {}

  if (typeof input.classroomName !== 'string') {
    errors.classroomName = 'ClassroomName must be a string.'
  }

  if (typeof input.classroomDescription !== 'string') {
    errors.classroomDescription = 'ClassroomDescription must be a string.'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  return {
    success: true,
    data: {
      classroomName: input.classroomName as string,
      classroomDescription: input.classroomDescription as string,
    },
  }
}
