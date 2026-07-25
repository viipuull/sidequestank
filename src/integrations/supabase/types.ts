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
      achievements: {
        Row: {
          active: boolean
          badge_image_url: string | null
          category: string
          color: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: string
          display_order: number
          goal_target: number
          hidden: boolean
          icon: string
          id: string
          name: string
          rarity: Database["public"]["Enums"]["achievement_rarity"]
          secret: boolean
          slug: string
          unlock_requirement: Json
          unlock_type: string
          updated_at: string
          xp_bonus: number
        }
        Insert: {
          active?: boolean
          badge_image_url?: string | null
          category?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          display_order?: number
          goal_target?: number
          hidden?: boolean
          icon?: string
          id?: string
          name: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          secret?: boolean
          slug: string
          unlock_requirement?: Json
          unlock_type?: string
          updated_at?: string
          xp_bonus?: number
        }
        Update: {
          active?: boolean
          badge_image_url?: string | null
          category?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          display_order?: number
          goal_target?: number
          hidden?: boolean
          icon?: string
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"]
          secret?: boolean
          slug?: string
          unlock_requirement?: Json
          unlock_type?: string
          updated_at?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          collection_id: string
          completion_order: number
          created_at: string
          id: string
          quest_id: string
          required: boolean
          unlock_requirement: Json
        }
        Insert: {
          collection_id: string
          completion_order?: number
          created_at?: string
          id?: string
          quest_id: string
          required?: boolean
          unlock_requirement?: Json
        }
        Update: {
          collection_id?: string
          completion_order?: number
          created_at?: string
          id?: string
          quest_id?: string
          required?: boolean
          unlock_requirement?: Json
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          banner_image_url: string | null
          category: string
          city: string
          collection_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string
          difficulty: Database["public"]["Enums"]["collection_difficulty"]
          display_order: number
          ends_at: string | null
          estimated_minutes: number
          featured: boolean
          hidden: boolean
          icon: string
          id: string
          name: string
          published_at: string | null
          repeatable: boolean
          reward_achievement_id: string | null
          reward_badge_image_url: string | null
          reward_summary: string
          reward_title_id: string | null
          reward_xp: number
          seasonal: boolean
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["collection_status"]
          tags: string[]
          updated_at: string
          visibility: Database["public"]["Enums"]["collection_visibility"]
        }
        Insert: {
          banner_image_url?: string | null
          category?: string
          city?: string
          collection_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["collection_difficulty"]
          display_order?: number
          ends_at?: string | null
          estimated_minutes?: number
          featured?: boolean
          hidden?: boolean
          icon?: string
          id?: string
          name: string
          published_at?: string | null
          repeatable?: boolean
          reward_achievement_id?: string | null
          reward_badge_image_url?: string | null
          reward_summary?: string
          reward_title_id?: string | null
          reward_xp?: number
          seasonal?: boolean
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          tags?: string[]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["collection_visibility"]
        }
        Update: {
          banner_image_url?: string | null
          category?: string
          city?: string
          collection_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["collection_difficulty"]
          display_order?: number
          ends_at?: string | null
          estimated_minutes?: number
          featured?: boolean
          hidden?: boolean
          icon?: string
          id?: string
          name?: string
          published_at?: string | null
          repeatable?: boolean
          reward_achievement_id?: string | null
          reward_badge_image_url?: string | null
          reward_summary?: string
          reward_title_id?: string | null
          reward_xp?: number
          seasonal?: boolean
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          tags?: string[]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["collection_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "collections_reward_achievement_id_fkey"
            columns: ["reward_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_reward_title_id_fkey"
            columns: ["reward_title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      player_achievements: {
        Row: {
          achievement_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          featured: boolean
          featured_order: number
          id: string
          progress: number
          reward_granted: boolean
          source: string
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          featured?: boolean
          featured_order?: number
          id?: string
          progress?: number
          reward_granted?: boolean
          source?: string
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          featured?: boolean
          featured_order?: number
          id?: string
          progress?: number
          reward_granted?: boolean
          source?: string
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      player_collections: {
        Row: {
          collection_id: string
          completed: boolean
          completed_at: string | null
          completed_quests: number
          created_at: string
          favorite: boolean
          id: string
          last_progress_at: string
          percent: number
          pinned: boolean
          reward_granted: boolean
          total_required: number
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id: string
          completed?: boolean
          completed_at?: string | null
          completed_quests?: number
          created_at?: string
          favorite?: boolean
          id?: string
          last_progress_at?: string
          percent?: number
          pinned?: boolean
          reward_granted?: boolean
          total_required?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          completed?: boolean
          completed_at?: string | null
          completed_quests?: number
          created_at?: string
          favorite?: boolean
          id?: string
          last_progress_at?: string
          percent?: number
          pinned?: boolean
          reward_granted?: boolean
          total_required?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      player_progress: {
        Row: {
          created_at: string
          current_level: number
          current_level_xp: number
          level_up_date: string | null
          lifetime_xp: number
          total_quests_completed: number
          updated_at: string
          user_id: string
          xp_for_next_level: number
        }
        Insert: {
          created_at?: string
          current_level?: number
          current_level_xp?: number
          level_up_date?: string | null
          lifetime_xp?: number
          total_quests_completed?: number
          updated_at?: string
          user_id: string
          xp_for_next_level?: number
        }
        Update: {
          created_at?: string
          current_level?: number
          current_level_xp?: number
          level_up_date?: string | null
          lifetime_xp?: number
          total_quests_completed?: number
          updated_at?: string
          user_id?: string
          xp_for_next_level?: number
        }
        Relationships: []
      }
      player_titles: {
        Row: {
          created_at: string
          equipped: boolean
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["title_source"]
          title_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipped?: boolean
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["title_source"]
          title_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipped?: boolean
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["title_source"]
          title_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_titles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
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
      titles: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["title_category"]
          color: string
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          hidden: boolean
          icon: string
          id: string
          name: string
          rarity: Database["public"]["Enums"]["title_rarity"]
          slug: string
          unlock_requirement: Json
          unlock_type: Database["public"]["Enums"]["title_unlock_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["title_category"]
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          hidden?: boolean
          icon?: string
          id?: string
          name: string
          rarity?: Database["public"]["Enums"]["title_rarity"]
          slug: string
          unlock_requirement?: Json
          unlock_type?: Database["public"]["Enums"]["title_unlock_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["title_category"]
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          hidden?: boolean
          icon?: string
          id?: string
          name?: string
          rarity?: Database["public"]["Enums"]["title_rarity"]
          slug?: string
          unlock_requirement?: Json
          unlock_type?: Database["public"]["Enums"]["title_unlock_type"]
          updated_at?: string
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
      xp_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          quest_id: string | null
          reason: string
          session_id: string | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          quest_id?: string | null
          reason?: string
          session_id?: string | null
          user_id: string
          xp_earned: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          quest_id?: string | null
          reason?: string
          session_id?: string | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quest_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _grant_title: {
        Args: {
          _source: Database["public"]["Enums"]["title_source"]
          _title_id: string
          _user_id: string
        }
        Returns: boolean
      }
      assign_title: {
        Args: { _title_id: string; _user_id: string }
        Returns: boolean
      }
      award_quest_completion_xp: {
        Args: { _session_id: string }
        Returns: Json
      }
      equip_highest_owned_title: {
        Args: { _user_id: string }
        Returns: undefined
      }
      equip_title: { Args: { _title_id: string }; Returns: boolean }
      evaluate_achievements_for_user: {
        Args: { _user_id: string }
        Returns: Json[]
      }
      evaluate_titles_for_user: {
        Args: { _user_id: string }
        Returns: {
          category: Database["public"]["Enums"]["title_category"]
          color: string
          description: string
          icon: string
          id: string
          name: string
          rarity: Database["public"]["Enums"]["title_rarity"]
          slug: string
        }[]
      }
      founder_assign_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_founder: { Args: never; Returns: boolean }
      level_from_total_xp: { Args: { _xp: number }; Returns: number }
      pioneer_slots_remaining: { Args: never; Returns: number }
      remove_title: {
        Args: { _title_id: string; _user_id: string }
        Returns: boolean
      }
      unequip_all_titles: { Args: never; Returns: boolean }
      update_collection_progress_for_user: {
        Args: { _quest_id: string; _user_id: string }
        Returns: {
          banner_image_url: string
          cover_image_url: string
          icon: string
          id: string
          name: string
          reward_summary: string
          reward_xp: number
          slug: string
        }[]
      }
      xp_required_for_level: { Args: { _level: number }; Returns: number }
    }
    Enums: {
      achievement_rarity:
        | "common"
        | "uncommon"
        | "rare"
        | "epic"
        | "legendary"
        | "mythic"
      app_role: "player" | "founder"
      collection_difficulty: "easy" | "medium" | "hard" | "expert"
      collection_status: "draft" | "published" | "archived"
      collection_visibility: "public" | "unlisted" | "private"
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
      title_category:
        | "explorer"
        | "adventure"
        | "completion"
        | "founder"
        | "seasonal"
        | "event"
        | "special"
        | "community"
        | "hidden"
      title_rarity:
        | "common"
        | "uncommon"
        | "rare"
        | "epic"
        | "legendary"
        | "mythic"
      title_source: "auto" | "founder" | "event" | "system"
      title_unlock_type:
        | "reach_level"
        | "quest_count"
        | "specific_quest"
        | "pioneer"
        | "founder"
        | "manual"
        | "event"
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
      achievement_rarity: [
        "common",
        "uncommon",
        "rare",
        "epic",
        "legendary",
        "mythic",
      ],
      app_role: ["player", "founder"],
      collection_difficulty: ["easy", "medium", "hard", "expert"],
      collection_status: ["draft", "published", "archived"],
      collection_visibility: ["public", "unlisted", "private"],
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
      title_category: [
        "explorer",
        "adventure",
        "completion",
        "founder",
        "seasonal",
        "event",
        "special",
        "community",
        "hidden",
      ],
      title_rarity: [
        "common",
        "uncommon",
        "rare",
        "epic",
        "legendary",
        "mythic",
      ],
      title_source: ["auto", "founder", "event", "system"],
      title_unlock_type: [
        "reach_level",
        "quest_count",
        "specific_quest",
        "pioneer",
        "founder",
        "manual",
        "event",
      ],
    },
  },
} as const
