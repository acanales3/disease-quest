export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          average_scores: Json
          created_at: string | null
          id: number
          source_id: number
          source_type: string
        }
        Insert: {
          average_scores: Json
          created_at?: string | null
          id?: never
          source_id: number
          source_type: string
        }
        Update: {
          average_scores?: Json
          created_at?: string | null
          id?: never
          source_id?: number
          source_type?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          classroom_id: number | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["case_status"]
        }
        Insert: {
          classroom_id?: number | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["case_status"]
        }
        Update: {
          classroom_id?: number | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["case_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cases_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_students: {
        Row: {
          classroom_id: number
          enrolled_at: string | null
          student_id: string
        }
        Insert: {
          classroom_id: number
          enrolled_at?: string | null
          student_id: string
        }
        Update: {
          classroom_id?: number
          enrolled_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_students_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      classrooms: {
        Row: {
          code: string
          created_at: string | null
          end_date: string | null
          id: number
          instructor_id: string
          name: string
          school: string | null
          section: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["classroom_status"]
        }
        Insert: {
          code: string
          created_at?: string | null
          end_date?: string | null
          id?: never
          instructor_id: string
          name: string
          school?: string | null
          section?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["classroom_status"]
        }
        Update: {
          code?: string
          created_at?: string | null
          end_date?: string | null
          id?: never
          instructor_id?: string
          name?: string
          school?: string | null
          section?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["classroom_status"]
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evaluations: {
        Row: {
          case_id: number
          communication_empathy: number | null
          created_at: string | null
          diagnostic_tests: number | null
          differential_diagnosis_formulation: number | null
          history_taking_synthesis: number | null
          id: number
          management_reasoning: number | null
          physical_exam_interpretation: number | null
          reflection_document: string | null
          reflection_metacognition: number | null
          student_id: string
        }
        Insert: {
          case_id: number
          communication_empathy?: number | null
          created_at?: string | null
          diagnostic_tests?: number | null
          differential_diagnosis_formulation?: number | null
          history_taking_synthesis?: number | null
          id?: never
          management_reasoning?: number | null
          physical_exam_interpretation?: number | null
          reflection_document?: string | null
          reflection_metacognition?: number | null
          student_id: string
        }
        Update: {
          case_id?: number
          communication_empathy?: number | null
          created_at?: string | null
          diagnostic_tests?: number | null
          differential_diagnosis_formulation?: number | null
          history_taking_synthesis?: number | null
          id?: never
          management_reasoning?: number | null
          physical_exam_interpretation?: number | null
          reflection_document?: string | null
          reflection_metacognition?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      instructors: {
        Row: {
          status: Database["public"]["Enums"]["instructor_status"]
          user_id: string
        }
        Insert: {
          status?: Database["public"]["Enums"]["instructor_status"]
          user_id: string
        }
        Update: {
          status?: Database["public"]["Enums"]["instructor_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          leaderboard_id: number
          rank: number | null
          score: number
          student_id: string
        }
        Insert: {
          leaderboard_id: number
          rank?: number | null
          score: number
          student_id: string
        }
        Update: {
          leaderboard_id?: number
          rank?: number | null
          score?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_leaderboard_id_fkey"
            columns: ["leaderboard_id"]
            isOneToOne: false
            referencedRelation: "leaderboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      leaderboards: {
        Row: {
          classroom_id: number | null
          created_at: string | null
          id: number
        }
        Insert: {
          classroom_id?: number | null
          created_at?: string | null
          id?: never
        }
        Update: {
          classroom_id?: number | null
          created_at?: string | null
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: number
          message: string
          timestamp_sent: string | null
          user_id: string
        }
        Insert: {
          id?: never
          message: string
          timestamp_sent?: string | null
          user_id: string
        }
        Update: {
          id?: never
          message?: string
          timestamp_sent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_cases: {
        Row: {
          case_id: number
          completed_at: string | null
          started_at: string | null
          student_id: string
        }
        Insert: {
          case_id: number
          completed_at?: string | null
          started_at?: string | null
          student_id: string
        }
        Update: {
          case_id?: number
          completed_at?: string | null
          started_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_cases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      students: {
        Row: {
          msyear: number | null
          nickname: string | null
          status: Database["public"]["Enums"]["student_status"]
          user_id: string
        }
        Insert: {
          msyear?: number | null
          nickname?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          user_id: string
        }
        Update: {
          msyear?: number | null
          nickname?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          school: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          school?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          school?: string | null
          token?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      case_status: "not started" | "in progress" | "completed"
      classroom_status: "active" | "inactive"
      instructor_status: "active" | "deactivated"
      student_status: "registered" | "unregistered"
      user_role: "ADMIN" | "INSTRUCTOR" | "STUDENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_status: ["not started", "in progress", "completed"],
      classroom_status: ["active", "inactive"],
      instructor_status: ["active", "deactivated"],
      student_status: ["registered", "unregistered"],
      user_role: ["ADMIN", "INSTRUCTOR", "STUDENT"],
    },
  },
} as const
