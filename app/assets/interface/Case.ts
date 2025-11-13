export interface Case {
  id: number;
  name: string;
  description: string;
  classroom: string;
  completionDate: string;
  status: "not started" | "in progress" | "completed";
}

export const cases: Case[] = [
  { 
    id: 1, 
    name: "Read Chapter1-3", 
    description: "Complete reading assignment for chapters 1-3", 
    classroom: "English", 
    completionDate: "12 May 2024",
    status: "in progress" 
  },
  { 
    id: 2, 
    name: "Complete Problem Set #5", 
    description: "Solve all problems in mathematics problem set 5", 
    classroom: "Maths", 
    completionDate: "12 May 2024", 
    status: "not started" 
  },
  { 
    id: 3, 
    name: "Write Lab Report on Acid-Base Titration", 
    description: "Document findings from chemistry lab experiment", 
    classroom: "Physics", 
    completionDate: "12 May 2024", 
    status: "in progress" 
  },
  { 
    id: 4, 
    name: "Prepare for Oral Presentation", 
    description: "Prepare slides and practice for chemistry presentation", 
    classroom: "Chemistry", 
    completionDate: "12 May 2024", 
    status: "in progress" 
  },
  { 
    id: 5, 
    name: "Create Art Piece for Final Project", 
    description: "Complete final art project submission", 
    classroom: "English", 
    completionDate: "12 May 2024", 
    status: "completed" 
  },
  { 
    id: 6, 
    name: "Write Research Paper on Climate Change", 
    description: "Research and write comprehensive paper on climate change", 
    classroom: "EVS", 
    completionDate: "12 May 2024", 
    status: "in progress" 
  },
  { 
    id: 7, 
    name: "Complete Math Quiz on Algebra", 
    description: "Take online quiz covering algebra concepts", 
    classroom: "Math", 
    completionDate: "12 May 2024", 
    status: "completed" 
  },
  { 
    id: 8, 
    name: "Prepare for History Class Debate", 
    description: "Research and prepare arguments for history debate", 
    classroom: "History", 
    completionDate: "12 May 2024", 
    status: "not started" 
  },
  { 
    id: 9, 
    name: "Submit Final Design for Architecture Project", 
    description: "Complete and submit final architectural design", 
    classroom: "Architecture", 
    completionDate: "12 May 2024", 
    status: "in progress" 
  },
  { 
    id: 10, 
    name: "Study for Biology Exam", 
    description: "Review all chapters for upcoming biology examination", 
    classroom: "Biology", 
    completionDate: "15 May 2024", 
    status: "not started" 
  },
  { 
    id: 11, 
    name: "Complete Programming Assignment", 
    description: "Finish coding assignment for computer science class", 
    classroom: "Computer Science", 
    completionDate: "18 May 2024", 
    status: "in progress" 
  },
  { 
    id: 12, 
    name: "Write Essay on Shakespeare", 
    description: "Analytical essay on Shakespeare's works", 
    classroom: "English", 
    completionDate: "20 May 2024", 
    status: "completed" 
  },
];