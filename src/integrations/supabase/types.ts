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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          fdc_id: string | null
          fiber_g: number
          food_name: string
          id: string
          logged_on: string
          meal: Database["public"]["Enums"]["meal_type"]
          protein_g: number
          serving_label: string | null
          servings: number
          sodium_mg: number
          sugar_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fdc_id?: string | null
          fiber_g?: number
          food_name: string
          id?: string
          logged_on?: string
          meal?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          serving_label?: string | null
          servings?: number
          sodium_mg?: number
          sugar_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fdc_id?: string | null
          fiber_g?: number
          food_name?: string
          id?: string
          logged_on?: string
          meal?: Database["public"]["Enums"]["meal_type"]
          protein_g?: number
          serving_label?: string | null
          servings?: number
          sodium_mg?: number
          sugar_g?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          calorie_target: number | null
          carbs_g: number | null
          created_at: string
          dietary_prefs: string[] | null
          display_name: string | null
          fat_g: number | null
          fiber_target_g: number | null
          goal: Database["public"]["Enums"]["goal_type"] | null
          goal_note: string | null
          height_cm: number | null
          onboarded: boolean
          protein_g: number | null
          sex: Database["public"]["Enums"]["sex_type"] | null
          sleep_target_hours: number | null
          sugar_target_g: number | null
          target_rate_kg_per_week: number | null
          training_days_per_week: number | null
          updated_at: string
          user_id: string
          water_ml_target: number
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          calorie_target?: number | null
          carbs_g?: number | null
          created_at?: string
          dietary_prefs?: string[] | null
          display_name?: string | null
          fat_g?: number | null
          fiber_target_g?: number | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          goal_note?: string | null
          height_cm?: number | null
          onboarded?: boolean
          protein_g?: number | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          sleep_target_hours?: number | null
          sugar_target_g?: number | null
          target_rate_kg_per_week?: number | null
          training_days_per_week?: number | null
          updated_at?: string
          user_id: string
          water_ml_target?: number
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          calorie_target?: number | null
          carbs_g?: number | null
          created_at?: string
          dietary_prefs?: string[] | null
          display_name?: string | null
          fat_g?: number | null
          fiber_target_g?: number | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          goal_note?: string | null
          height_cm?: number | null
          onboarded?: boolean
          protein_g?: number | null
          sex?: Database["public"]["Enums"]["sex_type"] | null
          sleep_target_hours?: number | null
          sugar_target_g?: number | null
          target_rate_kg_per_week?: number | null
          training_days_per_week?: number | null
          updated_at?: string
          user_id?: string
          water_ml_target?: number
          weight_kg?: number | null
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          created_at: string
          hours: number
          id: string
          logged_on: string
          note: string | null
          quality: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hours: number
          id?: string
          logged_on?: string
          note?: string | null
          quality?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          logged_on?: string
          note?: string | null
          quality?: number | null
          user_id?: string
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_on: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_on?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_on?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          id: string
          logged_on: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_on?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_on?: string
          user_id?: string
          weight_kg?: number
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
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      goal_type: "lose" | "maintain" | "gain" | "build_muscle"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      sex_type: "male" | "female"
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
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      goal_type: ["lose", "maintain", "gain", "build_muscle"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      sex_type: ["male", "female"],
    },
  },
} as const
