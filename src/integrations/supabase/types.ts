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
      bucket_list_completions: {
        Row: {
          completed_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          checked_in_at: string
          device_fingerprint: string | null
          id: string
          place_id: string
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string
          device_fingerprint?: string | null
          id?: string
          place_id: string
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string
          device_fingerprint?: string | null
          id?: string
          place_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          activities: string[]
          best_time: string | null
          budget_tier: string
          category: string
          created_at: string
          description: string
          distance_km: number
          duration_type: string
          entry_fee: number
          food_cost: number
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          moods: string[]
          name: string
          opening_hours: Json | null
          rating: number
          stay_cost: number
          transport_cost: number
          travel_types: string[]
          updated_at: string
        }
        Insert: {
          activities?: string[]
          best_time?: string | null
          budget_tier?: string
          category: string
          created_at?: string
          description: string
          distance_km: number
          duration_type?: string
          entry_fee?: number
          food_cost?: number
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          moods?: string[]
          name: string
          opening_hours?: Json | null
          rating?: number
          stay_cost?: number
          transport_cost?: number
          travel_types?: string[]
          updated_at?: string
        }
        Update: {
          activities?: string[]
          best_time?: string | null
          budget_tier?: string
          category?: string
          created_at?: string
          description?: string
          distance_km?: number
          duration_type?: string
          entry_fee?: number
          food_cost?: number
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          moods?: string[]
          name?: string
          opening_hours?: Json | null
          rating?: number
          stay_cost?: number
          transport_cost?: number
          travel_types?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          ends_at: string | null
          hidden: boolean
          id: string
          image_url: string | null
          link: string | null
          location: string
          organizer: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description: string
          ends_at?: string | null
          hidden?: boolean
          id?: string
          image_url?: string | null
          link?: string | null
          location: string
          organizer?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          ends_at?: string | null
          hidden?: boolean
          id?: string
          image_url?: string | null
          link?: string | null
          location?: string
          organizer?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      explorer_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          points_awarded: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          points_awarded?: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          points_awarded?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          destination_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      place_submissions: {
        Row: {
          best_times: string[]
          category: string
          cost_range: string
          description: string
          id: string
          image_url: string | null
          maps_link: string | null
          name: string
          opening_hours: string | null
          pro_tip: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
          submitter_batch: number | null
          updated_at: string
          vibes: string[]
        }
        Insert: {
          best_times?: string[]
          category: string
          cost_range?: string
          description: string
          id?: string
          image_url?: string | null
          maps_link?: string | null
          name: string
          opening_hours?: string | null
          pro_tip?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          submitter_batch?: number | null
          updated_at?: string
          vibes?: string[]
        }
        Update: {
          best_times?: string[]
          category?: string
          cost_range?: string
          description?: string
          id?: string
          image_url?: string | null
          maps_link?: string | null
          name?: string
          opening_hours?: string | null
          pro_tip?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          submitter_batch?: number | null
          updated_at?: string
          vibes?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch_year: number | null
          bio: string | null
          created_at: string
          display_name: string | null
          explorer_score: number
          id: string
          onboarded: boolean
          profile_emoji: string
          taste_profile: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          batch_year?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          explorer_score?: number
          id?: string
          onboarded?: boolean
          profile_emoji?: string
          taste_profile?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          batch_year?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          explorer_score?: number
          id?: string
          onboarded?: boolean
          profile_emoji?: string
          taste_profile?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_trips: {
        Row: {
          created_at: string
          destination_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          destination_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_history: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          selected_destination_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences: Json
          selected_destination_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          selected_destination_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_history_selected_destination_id_fkey"
            columns: ["selected_destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_logs: {
        Row: {
          created_at: string
          date_visited: string | null
          destination_name: string
          id: string
          notes: string | null
          rating: number | null
          spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_visited?: string | null
          destination_name: string
          id?: string
          notes?: string | null
          rating?: number | null
          spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_visited?: string | null
          destination_name?: string
          id?: string
          notes?: string | null
          rating?: number | null
          spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      waitlist: {
        Row: {
          created_at: string
          email: string
          feature_id: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          feature_id: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          feature_id?: string
          id?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
