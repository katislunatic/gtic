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
      admin_discord_users: {
        Row: {
          added_by: string | null
          created_at: string
          discord_user_id: string
          username: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          discord_user_id: string
          username?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          discord_user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          date: string
          id: string
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          date?: string
          id?: string
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          date?: string
          id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      credits: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_user_id: string | null
          id: string
          name: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_user_id?: string | null
          id?: string
          name: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_user_id?: string | null
          id?: string
          name?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      official_teams: {
        Row: {
          created_at: string
          description: string | null
          emoji: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          path: string
          referrer: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          path: string
          referrer?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          description: string
          id: string
          logo: string | null
          name: string
          sort_order: number | null
          tier: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          logo?: string | null
          name: string
          sort_order?: number | null
          tier?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          logo?: string | null
          name?: string
          sort_order?: number | null
          tier?: string
          website?: string | null
        }
        Relationships: []
      }
      staff_categories: {
        Row: {
          color: string | null
          created_at: string
          discord_role_id: string | null
          id: string
          is_badge_only: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          discord_role_id?: string | null
          id?: string
          is_badge_only?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          discord_role_id?: string | null
          id?: string
          is_badge_only?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          avatar_url: string | null
          badge: string | null
          banner_url: string | null
          category_id: string
          created_at: string
          decoration_url: string | null
          discord_user_id: string | null
          display_name: string
          id: string
          is_synced: boolean
          last_synced_at: string | null
          sort_order: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          badge?: string | null
          banner_url?: string | null
          category_id: string
          created_at?: string
          decoration_url?: string | null
          discord_user_id?: string | null
          display_name?: string
          id?: string
          is_synced?: boolean
          last_synced_at?: string | null
          sort_order?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          badge?: string | null
          banner_url?: string | null
          category_id?: string
          created_at?: string
          decoration_url?: string | null
          discord_user_id?: string | null
          display_name?: string
          id?: string
          is_synced?: boolean
          last_synced_at?: string | null
          sort_order?: number
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "staff_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          category_id: string
          created_at: string
          discord_user_id: string | null
          id: string
          option_id: string
          voter_key: string
        }
        Insert: {
          category_id: string
          created_at?: string
          discord_user_id?: string | null
          id?: string
          option_id: string
          voter_key: string
        }
        Update: {
          category_id?: string
          created_at?: string
          discord_user_id?: string | null
          id?: string
          option_id?: string
          voter_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "voting_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "voting_options"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_campaigns: {
        Row: {
          created_at: string
          description: string
          id: string
          results_mode: string
          results_revealed: boolean
          slug: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          results_mode?: string
          results_revealed?: boolean
          slug: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          results_mode?: string
          results_revealed?: boolean
          slug?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      voting_categories: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          title: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "voting_categories_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "voting_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_options: {
        Row: {
          category_id: string
          created_at: string
          discord_user_id: string | null
          display_name_override: string | null
          id: string
          image_url: string | null
          label: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          discord_user_id?: string | null
          display_name_override?: string | null
          id?: string
          image_url?: string | null
          label: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          discord_user_id?: string | null
          display_name_override?: string | null
          id?: string
          image_url?: string | null
          label?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_options_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "voting_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_page_view_stats: { Args: never; Returns: Json }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      track_page_duration: {
        Args: { _id: string; _ms: number }
        Returns: undefined
      }
      track_page_view: {
        Args: { _path: string; _referrer?: string; _session_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
