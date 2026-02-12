export interface Case {
  id: number;
  name: string;
  description: string;
  classroom: number;
  completionDate: string;
  status: "not started" | "in progress" | "completed";
  // action column still needed
}

export const cases: Case[] = [];