export interface Instructor {
  id: string;
  name: string;
  email: string;
  school: string;
  classroom: number;
  status: "active" | "deactivated";
  // action column still needed
}
