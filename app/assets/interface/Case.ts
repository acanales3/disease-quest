interface Case {
  id: number;
  name: string;
  description: string;
  classroom: number;
  completionDate: string;
  status: "not started" | "in progress" | "completed";
  // action column still needed
}

export const cases: Case[] = [
  {
    id: 0,
    name: "Case 1",
    description: "This is a short description.",
    classroom: 1,
    completionDate: "N/A",
    status: "not started",
  },
  {
    id: 1,
    name: "Case 2",
    description: "That tells a little bit about the case.",
    classroom: 2,
    completionDate: "N/A",
    status: "in progress",
  },
  {
    id: 2,
    name: "Case 3",
    description: "Such as key topics and learning objectives.",
    classroom: 3,
    completionDate: "2022-01-03",
    status: "completed",
  },
];
