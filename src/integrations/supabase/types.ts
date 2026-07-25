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
      objective_progress: {
        Row: {
          attempts: number
          created_at: string
          id: string
          objective_id: string
          session_id: string
          status: Database["public"]["Enums"]["objective_progress_status"]
          updated_at: string
          user_id: string
          verification_data: Json
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          objective_id: string
          session_id: string
          status?: Database["public"]["Enums"]["objective_progress_status"]
          updated_at?: string
          user_id: string
          verification_data?: Json
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          objective_id?: string
          session_id?: string
          status?: Database["public"]["Enums"]["objective_progress_status"]
          updated_at?: string
          user_id?: string
          verification_data?: Json
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objective_progress_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "quest_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objective_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string
          created_at: string
          display_name: string
          id: string
          is_pioneer: boolean
          level: number
          pioneer_number: number | null
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          city?: string
          created_at?: string
          display_name: string
          id: string
          is_pioneer?: boolean
          level?: number
          pioneer_number?: number | null
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          city?: string
          created_at?: string
          display_name?: string
          id?: string
          is_pioneer?: boolean
          level?: number
          pioneer_number?: number | null
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      quest_objectives: {
        Row: {
          completion_order: number
          config: Json
          created_at: string
          description: string
          id: string
          objective_type: Database["public"]["Enums"]["objective_type"]
          quest_id: string
          required: boolean
          title: string
          updated_at: string
        }
        Insert: {
          completion_order?: number
          config?: Json
          created_at?: string
          description?: string
          id?: string
          objective_type?: Database["public"]["Enums"]["objective_type"]
          quest_id: string
          required?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          completion_order?: number
          config?: Json
          created_at?: string
          description?: string
          id?: string
          objective_type?: Database["public"]["Enums"]["objective_type"]
          quest_id?: string
          required?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_objectives_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_activity_at: string
          quest_id: string
          started_at: string
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          quest_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          quest_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_sessions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["quest_category"]
          city: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          difficulty: Database["public"]["Enums"]["quest_difficulty"]
          ends_at: string | null
          estimated_minutes: number
          featured: boolean
          full_description: string
          gallery_urls: string[]
          id: string
          latitude: number | null
          longitude: number | null
          published_at: string | null
          quest_type: Database["public"]["Enums"]["quest_type"]
          reward_preview: string
          reward_xp: number
          short_description: string
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["quest_status"]
          tags: string[]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["quest_visibility"]
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["quest_category"]
          city?: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          ends_at?: string | null
          estimated_minutes?: number
          featured?: boolean
          full_description?: string
          gallery_urls?: string[]
          id?: string
          latitude?: number | null
          longitude?: number | null
          published_at?: string | null
          quest_type?: Database["public"]["Enums"]["quest_type"]
          reward_preview?: string
          reward_xp?: number
          short_description?: string
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["quest_status"]
          tags?: string[]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["quest_visibility"]
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["quest_category"]
          city?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          difficulty?: Database["public"]["Enums"]["quest_difficulty"]
          ends_at?: string | null
          estimated_minutes?: number
          featured?: boolean
          full_description?: string
          gallery_urls?: string[]
          id?: string
          latitude?: number | null
          longitude?: number | null
          published_at?: string | null
          quest_type?: Database["public"]["Enums"]["quest_type"]
          reward_preview?: string
          reward_xp?: number
          short_description?: string
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["quest_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["quest_visibility"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_founder: { Args: never; Returns: boolean }
      pioneer_slots_remaining: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "player" | "founder"
      objective_progress_status: "pending" | "completed" | "failed" | "skipped"
      objective_type:
        | "visit_location"
        | "gps_checkin"
        | "scan_qr"
        | "take_photo"
        | "answer_trivia"
        | "collect_item"
        | "custom"
      quest_category:
        | "exploration"
        | "food"
        | "culture"
        | "nature"
        | "history"
        | "photography"
        | "trivia"
        | "fitness"
        | "nightlife"
        | "community"
      quest_difficulty: "easy" | "medium" | "hard" | "expert"
      quest_status: "draft" | "published" | "archived"
      quest_type:
        | "walking"
        | "photo"
        | "trivia"
        | "treasure_hunt"
        | "gps_checkin"
        | "qr_hunt"
        | "event"
        | "limited_time"
      quest_visibility: "public" | "unlisted" | "private"
      session_status: "active" | "paused" | "completed" | "abandoned"
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
      app_role: ["player", "founder"],
      objective_progress_status: ["pending", "completed", "failed", "skipped"],
      objective_type: [
        "visit_location",
        "gps_checkin",
        "scan_qr",
        "take_photo",
        "answer_trivia",
        "collect_item",
        "custom",
      ],
      quest_category: [
        "exploration",
        "food",
        "culture",
        "nature",
        "history",
        "photography",
        "trivia",
        "fitness",
        "nightlife",
        "community",
      ],
      quest_difficulty: ["easy", "medium", "hard", "expert"],
      quest_status: ["draft", "published", "archived"],
      quest_type: [
        "walking",
        "photo",
        "trivia",
        "treasure_hunt",
        "gps_checkin",
        "qr_hunt",
        "event",
        "limited_time",
      ],
      quest_visibility: ["public", "unlisted", "private"],
      session_status: ["active", "paused", "completed", "abandoned"],
    },
  },
} as const
