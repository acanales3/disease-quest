export interface CaseScore {
  case: string
  score: number
}

export interface GraphProps {
  data: CaseScore[]
  index: keyof CaseScore
  categories: (keyof CaseScore)[]
  colors?: string[]
  title?: string
}
