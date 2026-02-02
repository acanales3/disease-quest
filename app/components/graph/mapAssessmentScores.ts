export type CategoryScore = {
  label: string
  score: number
}

const CATEGORY_MAP = [
  { key: 'history_taking_synthesis', label: 'History Taking and Synthesis' },
  { key: 'physical_exam_interpretation', label: 'Physical Exam Interpretation' },
  { key: 'differential_diagnosis_formulation', label: 'Differential Diagnosis Formulation' },
  { key: 'diagnostic_tests', label: 'Diagnostic Tests' },
  { key: 'management_reasoning', label: 'Management Reasoning' },
  { key: 'communication_empathy', label: 'Communication and Empathy' },
  { key: 'reflection_metacognition', label: 'Reflection and Metacognition' },
] as const

export function mapCategoryAverages(rows: any[]): CategoryScore[] {
  if (!rows.length) {
    return CATEGORY_MAP.map(c => ({ label: c.label, score: 0 }))
  }

  return CATEGORY_MAP.map(({ key, label }) => {
    const values = rows.map(r => r[key]).filter((v: number | null) => typeof v === 'number')

    const avg = values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length)

    return { label, score: avg }
  })  
}