export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  school?: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  created_at?: string;
}
