export interface Case {
  id: number;
  name: string;
  description: string;
  classrooms: { id: number; name: string }[];
  completionDate: string;
  status: "not started" | "in progress" | "completed";
  // action column still needed
}

export const cases: Case[] = [];