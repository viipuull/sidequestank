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
      activity_events: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          payload: Json
          ref_id: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["activity_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          payload?: Json
          ref_id?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["activity_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          payload?: Json
          ref_id?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["activity_visibility"]
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          banner_url: string | null
          body: string
          created_at: string
          created_by: string | null
          deep_link: string | null
          ends_at: string | null
          icon: string
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          starts_at: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          banner_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          ends_at?: string | null
          icon?: string
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          starts_at?: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          banner_url?: string | null
          body?: string
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          ends_at?: string | null
          icon?: string
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          starts_at?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after: Json
          before: Json
          created_at: string
          id: string
          metadata: Json
          summary: string | null
          target_id: string | null
          target_kind: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json
          before?: Json
          created_at?: string
          id?: string
          metadata?: Json
          summary?: string | null
          target_id?: string | null
          target_kind: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after?: Json
          before?: Json
          created_at?: string
          id?: string
          metadata?: Json
          summary?: string | null
          target_id?: string | null
          target_kind?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          icon: string
          id: string
          metric: Database["public"]["Enums"]["challenge_metric"]
          name: string
          reset_frequency: Database["public"]["Enums"]["challenge_reset"]
          reward_achievement_id: string | null
          reward_title_id: string | null
          reward_xp: number
          slug: string
          target: number
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          icon?: string
          id?: string
          metric: Database["public"]["Enums"]["challenge_metric"]
          name: string
          reset_frequency?: Database["public"]["Enums"]["challenge_reset"]
          reward_achievement_id?: string | null
          reward_title_id?: string | null
          reward_xp?: number
          slug: string
          target: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          icon?: string
          id?: string
          metric?: Database["public"]["Enums"]["challenge_metric"]
          name?: string
          reset_frequency?: Database["public"]["Enums"]["challenge_reset"]
          reward_achievement_id?: string | null
          reward_title_id?: string | null
          reward_xp?: number
          slug?: string
          target?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "challenges_reward_achievement_id_fkey"
            columns: ["reward_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_reward_title_id_fkey"
            columns: ["reward_title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
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
      event_challenges: {
        Row: {
          challenge_id: string
          display_order: number
          event_id: string
          id: string
        }
        Insert: {
          challenge_id: string
          display_order?: number
          event_id: string
          id?: string
        }
        Update: {
          challenge_id?: string
          display_order?: number
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_challenges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_quests: {
        Row: {
          created_at: string
          display_order: number
          event_id: string
          featured: boolean
          id: string
          quest_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_id: string
          featured?: boolean
          id?: string
          quest_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          event_id?: string
          featured?: boolean
          id?: string
          quest_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_quests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rewards: {
        Row: {
          achievement_id: string | null
          badge_image_url: string | null
          collection_id: string | null
          created_at: string
          display_order: number
          event_id: string
          id: string
          kind: Database["public"]["Enums"]["reward_kind"]
          label: string
          title_id: string | null
          xp_amount: number
        }
        Insert: {
          achievement_id?: string | null
          badge_image_url?: string | null
          collection_id?: string | null
          created_at?: string
          display_order?: number
          event_id: string
          id?: string
          kind: Database["public"]["Enums"]["reward_kind"]
          label?: string
          title_id?: string | null
          xp_amount?: number
        }
        Update: {
          achievement_id?: string | null
          badge_image_url?: string | null
          collection_id?: string | null
          created_at?: string
          display_order?: number
          event_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["reward_kind"]
          label?: string
          title_id?: string | null
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_rewards_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rewards_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rewards_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rewards_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          archived_at: string | null
          banner_url: string | null
          community_goal: number
          community_progress: number
          config: Json
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          featured: boolean
          icon: string
          id: string
          max_participants: number | null
          name: string
          priority: number
          published_at: string | null
          repeatable: boolean
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          archived_at?: string | null
          banner_url?: string | null
          community_goal?: number
          community_progress?: number
          config?: Json
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          featured?: boolean
          icon?: string
          id?: string
          max_participants?: number | null
          name: string
          priority?: number
          published_at?: string | null
          repeatable?: boolean
          slug: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          archived_at?: string | null
          banner_url?: string | null
          community_goal?: number
          community_progress?: number
          config?: Json
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          featured?: boolean
          icon?: string
          id?: string
          max_participants?: number | null
          name?: string
          priority?: number
          published_at?: string | null
          repeatable?: boolean
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: []
      }
      featured_players: {
        Row: {
          active: boolean
          blurb: string
          created_at: string
          created_by: string | null
          id: string
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          blurb?: string
          created_at?: string
          created_by?: string | null
          id?: string
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          blurb?: string
          created_at?: string
          created_by?: string | null
          id?: string
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      featured_quests: {
        Row: {
          boost: boolean
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          note: string | null
          priority: number
          quest_id: string
          starts_at: string
        }
        Insert: {
          boost?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          note?: string | null
          priority?: number
          quest_id: string
          starts_at?: string
        }
        Update: {
          boost?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          note?: string | null
          priority?: number
          quest_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_seasons: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          name: string
          slug: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          name: string
          slug: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          slug?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          achievements_earned: number
          collections_completed: number
          computed_at: string
          id: string
          level: number
          period: Database["public"]["Enums"]["leaderboard_period"]
          period_key: string
          quests_completed: number
          rank: number
          scope: Database["public"]["Enums"]["leaderboard_scope"]
          scope_key: string
          season_id: string | null
          titles_earned: number
          user_id: string
          xp: number
        }
        Insert: {
          achievements_earned?: number
          collections_completed?: number
          computed_at?: string
          id?: string
          level?: number
          period: Database["public"]["Enums"]["leaderboard_period"]
          period_key?: string
          quests_completed?: number
          rank: number
          scope: Database["public"]["Enums"]["leaderboard_scope"]
          scope_key?: string
          season_id?: string | null
          titles_earned?: number
          user_id: string
          xp?: number
        }
        Update: {
          achievements_earned?: number
          collections_completed?: number
          computed_at?: string
          id?: string
          level?: number
          period?: Database["public"]["Enums"]["leaderboard_period"]
          period_key?: string
          quests_completed?: number
          rank?: number
          scope?: Database["public"]["Enums"]["leaderboard_scope"]
          scope_key?: string
          season_id?: string | null
          titles_earned?: number
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          created_at: string
          filename: string
          height: number | null
          id: string
          mime_type: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          filename: string
          height?: number | null
          id?: string
          mime_type: string
          size_bytes: number
          storage_bucket?: string
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          filename?: string
          height?: number | null
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          deep_link: string | null
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          metadata: Json
          priority: number
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          deep_link?: string | null
          icon?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          metadata?: Json
          priority?: number
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          deep_link?: string | null
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          metadata?: Json
          priority?: number
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      objective_progress: {
        Row: {
          attempts: number
          created_at: string
          id: string
          objective_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      player_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          period_start: string
          progress: number
          reward_granted: boolean
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          period_start: string
          progress?: number
          reward_granted?: boolean
          target: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          period_start?: string
          progress?: number
          reward_granted?: boolean
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
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
      player_events: {
        Row: {
          completed: boolean
          completed_at: string | null
          contribution: number
          event_id: string
          id: string
          joined: boolean
          joined_at: string
          percent: number
          progress: number
          reward_granted: boolean
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          contribution?: number
          event_id: string
          id?: string
          joined?: boolean
          joined_at?: string
          percent?: number
          progress?: number
          reward_granted?: boolean
          target?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          contribution?: number
          event_id?: string
          id?: string
          joined?: boolean
          joined_at?: string
          percent?: number
          progress?: number
          reward_granted?: boolean
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      player_social_settings: {
        Row: {
          allow_followers: boolean
          allow_friend_requests: boolean
          appear_on_leaderboard: boolean
          banner_url: string | null
          bio: string | null
          created_at: string
          moderation_hidden: boolean
          public_profile: boolean
          show_achievements: boolean
          show_collections: boolean
          show_level: boolean
          show_stats: boolean
          show_titles: boolean
          show_xp: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_followers?: boolean
          allow_friend_requests?: boolean
          appear_on_leaderboard?: boolean
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          moderation_hidden?: boolean
          public_profile?: boolean
          show_achievements?: boolean
          show_collections?: boolean
          show_level?: boolean
          show_stats?: boolean
          show_titles?: boolean
          show_xp?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_followers?: boolean
          allow_friend_requests?: boolean
          appear_on_leaderboard?: boolean
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          moderation_hidden?: boolean
          public_profile?: boolean
          show_achievements?: boolean
          show_collections?: boolean
          show_level?: boolean
          show_stats?: boolean
          show_titles?: boolean
          show_xp?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_stats: {
        Row: {
          achievements_earned: number
          cities_explored: number
          collections_completed: number
          created_at: string
          join_date: string
          last_active_at: string | null
          level: number
          quests_completed: number
          titles_earned: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements_earned?: number
          cities_explored?: number
          collections_completed?: number
          created_at?: string
          join_date?: string
          last_active_at?: string | null
          level?: number
          quests_completed?: number
          titles_earned?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements_earned?: number
          cities_explored?: number
          collections_completed?: number
          created_at?: string
          join_date?: string
          last_active_at?: string | null
          level?: number
          quests_completed?: number
          titles_earned?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
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
          suspended_at: string | null
          suspended_reason: string | null
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
          suspended_at?: string | null
          suspended_reason?: string | null
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
          suspended_at?: string | null
          suspended_reason?: string | null
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
          repeatable: boolean
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
          repeatable?: boolean
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
          repeatable?: boolean
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
      _assert_founder: { Args: never; Returns: undefined }
      _grant_challenge_reward: { Args: { _pc_id: string }; Returns: undefined }
      _grant_event_rewards: {
        Args: { _event_id: string; _user_id: string }
        Returns: undefined
      }
      _grant_title: {
        Args: {
          _source: Database["public"]["Enums"]["title_source"]
          _title_id: string
          _user_id: string
        }
        Returns: boolean
      }
      admin_adjust_xp: {
        Args: { _delta: number; _reason: string; _user_id: string }
        Returns: Json
      }
      admin_get_player: { Args: { _user_id: string }; Returns: Json }
      admin_grant_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: boolean
      }
      admin_grant_title: {
        Args: { _title_id: string; _user_id: string }
        Returns: boolean
      }
      admin_list_players: {
        Args: {
          _city?: string
          _limit?: number
          _min_level?: number
          _offset?: number
          _only_founder?: boolean
          _only_hidden?: boolean
          _only_pioneer?: boolean
          _only_suspended?: boolean
          _search?: string
        }
        Returns: {
          avatar_url: string
          city: string
          created_at: string
          display_name: string
          id: string
          is_founder: boolean
          is_pioneer: boolean
          last_active_at: string
          level: number
          moderation_hidden: boolean
          pioneer_number: number
          quests_completed: number
          suspended_at: string
          username: string
          xp: number
        }[]
      }
      admin_reset_event_progress: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      admin_reset_quest_session: {
        Args: { _session_id: string }
        Returns: boolean
      }
      admin_restore_player: { Args: { _user_id: string }; Returns: boolean }
      admin_revoke_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: boolean
      }
      admin_revoke_title: {
        Args: { _title_id: string; _user_id: string }
        Returns: boolean
      }
      admin_set_profile_hidden: {
        Args: { _hidden: boolean; _user_id: string }
        Returns: boolean
      }
      admin_suspend_player: {
        Args: { _reason: string; _user_id: string }
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
      compute_leaderboard: {
        Args: {
          _period: Database["public"]["Enums"]["leaderboard_period"]
          _period_key: string
          _scope: Database["public"]["Enums"]["leaderboard_scope"]
          _scope_key: string
          _season_id?: string
        }
        Returns: number
      }
      current_period_start: {
        Args: { _freq: Database["public"]["Enums"]["challenge_reset"] }
        Returns: string
      }
      ensure_leaderboard: {
        Args: {
          _max_age_seconds?: number
          _period: Database["public"]["Enums"]["leaderboard_period"]
          _period_key: string
          _scope: Database["public"]["Enums"]["leaderboard_scope"]
          _scope_key: string
        }
        Returns: undefined
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
      founder_approve_photo: {
        Args: { _notes?: string; _progress_id: string }
        Returns: Json
      }
      founder_assign_achievement: {
        Args: { _achievement_id: string; _user_id: string }
        Returns: Json
      }
      founder_reject_photo: {
        Args: { _progress_id: string; _reason: string }
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
      join_event: { Args: { _event_id: string }; Returns: Json }
      level_from_total_xp: { Args: { _xp: number }; Returns: number }
      notify_user: {
        Args: {
          _body: string
          _deep_link?: string
          _icon?: string
          _kind: Database["public"]["Enums"]["notification_kind"]
          _metadata?: Json
          _priority?: number
          _title: string
          _user_id: string
        }
        Returns: string
      }
      pioneer_slots_remaining: { Args: never; Returns: number }
      progress_challenges_for_user: {
        Args: { _delta: Json; _user_id: string }
        Returns: undefined
      }
      progress_events_for_user: {
        Args: { _delta: number; _user_id: string }
        Returns: undefined
      }
      recompute_default_leaderboards: { Args: never; Returns: undefined }
      recompute_player_stats: { Args: { _user_id: string }; Returns: undefined }
      record_activity_event: {
        Args: {
          _kind: Database["public"]["Enums"]["activity_kind"]
          _payload: Json
          _ref_id: string
          _user_id: string
        }
        Returns: string
      }
      record_audit: {
        Args: {
          _action: string
          _after?: Json
          _before?: Json
          _metadata?: Json
          _summary?: string
          _target_id: string
          _target_kind: string
        }
        Returns: string
      }
      remove_title: {
        Args: { _title_id: string; _user_id: string }
        Returns: boolean
      }
      tick_liveops: { Args: never; Returns: Json }
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
      activity_kind:
        | "quest_completed"
        | "level_up"
        | "title_unlocked"
        | "achievement_unlocked"
        | "collection_completed"
      activity_visibility: "public" | "friends" | "guild" | "private"
      announcement_priority: "info" | "normal" | "high" | "critical"
      app_role: "player" | "founder"
      challenge_metric:
        | "quests_completed"
        | "xp_earned"
        | "locations_visited"
        | "qr_scans"
        | "photos_submitted"
        | "collections_completed"
        | "achievements_unlocked"
        | "level_reached"
        | "trivia_correct"
      challenge_reset: "none" | "daily" | "weekly" | "monthly"
      collection_difficulty: "easy" | "medium" | "hard" | "expert"
      collection_status: "draft" | "published" | "archived"
      collection_visibility: "public" | "unlisted" | "private"
      event_status: "draft" | "scheduled" | "live" | "ended" | "archived"
      event_type:
        | "daily_quest_set"
        | "weekly_challenge"
        | "monthly_challenge"
        | "seasonal"
        | "holiday"
        | "limited_time"
        | "founder"
        | "community"
        | "beta"
        | "sponsored"
      event_visibility: "public" | "unlisted" | "private"
      leaderboard_period: "all_time" | "weekly" | "monthly" | "seasonal"
      leaderboard_scope:
        | "global"
        | "country"
        | "state"
        | "city"
        | "event"
        | "friends"
        | "team"
      notification_kind:
        | "quest_completed"
        | "xp_earned"
        | "level_up"
        | "achievement_unlocked"
        | "title_unlocked"
        | "collection_completed"
        | "event_started"
        | "event_ending"
        | "event_reward"
        | "challenge_reward"
        | "daily_reset"
        | "weekly_reset"
        | "monthly_reset"
        | "announcement"
        | "leaderboard"
        | "system"
      objective_progress_status:
        | "pending"
        | "completed"
        | "failed"
        | "skipped"
        | "pending_review"
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
      reward_kind: "xp" | "title" | "achievement" | "collection" | "badge_image"
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
      activity_kind: [
        "quest_completed",
        "level_up",
        "title_unlocked",
        "achievement_unlocked",
        "collection_completed",
      ],
      activity_visibility: ["public", "friends", "guild", "private"],
      announcement_priority: ["info", "normal", "high", "critical"],
      app_role: ["player", "founder"],
      challenge_metric: [
        "quests_completed",
        "xp_earned",
        "locations_visited",
        "qr_scans",
        "photos_submitted",
        "collections_completed",
        "achievements_unlocked",
        "level_reached",
        "trivia_correct",
      ],
      challenge_reset: ["none", "daily", "weekly", "monthly"],
      collection_difficulty: ["easy", "medium", "hard", "expert"],
      collection_status: ["draft", "published", "archived"],
      collection_visibility: ["public", "unlisted", "private"],
      event_status: ["draft", "scheduled", "live", "ended", "archived"],
      event_type: [
        "daily_quest_set",
        "weekly_challenge",
        "monthly_challenge",
        "seasonal",
        "holiday",
        "limited_time",
        "founder",
        "community",
        "beta",
        "sponsored",
      ],
      event_visibility: ["public", "unlisted", "private"],
      leaderboard_period: ["all_time", "weekly", "monthly", "seasonal"],
      leaderboard_scope: [
        "global",
        "country",
        "state",
        "city",
        "event",
        "friends",
        "team",
      ],
      notification_kind: [
        "quest_completed",
        "xp_earned",
        "level_up",
        "achievement_unlocked",
        "title_unlocked",
        "collection_completed",
        "event_started",
        "event_ending",
        "event_reward",
        "challenge_reward",
        "daily_reset",
        "weekly_reset",
        "monthly_reset",
        "announcement",
        "leaderboard",
        "system",
      ],
      objective_progress_status: [
        "pending",
        "completed",
        "failed",
        "skipped",
        "pending_review",
      ],
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
      reward_kind: ["xp", "title", "achievement", "collection", "badge_image"],
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
