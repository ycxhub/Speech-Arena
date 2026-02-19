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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          key_name: string
          masked_preview: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          key_name: string
          masked_preview?: string | null
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          key_name?: string
          masked_preview?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_files: {
        Row: {
          created_at: string
          duration_ms: number | null
          file_size_bytes: number | null
          generation_latency_ms: number | null
          id: string
          model_id: string
          provider_request_id: string | null
          r2_key: string
          sentence_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          file_size_bytes?: number | null
          generation_latency_ms?: number | null
          id?: string
          model_id: string
          provider_request_id?: string | null
          r2_key: string
          sentence_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          file_size_bytes?: number | null
          generation_latency_ms?: number | null
          id?: string
          model_id?: string
          provider_request_id?: string | null
          r2_key?: string
          sentence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_files_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_ratings_by_language: {
        Row: {
          id: string
          language_id: string
          last_updated: string
          losses: number
          matches_played: number
          model_id: string
          rating: number
          wins: number
        }
        Insert: {
          id?: string
          language_id: string
          last_updated?: string
          losses?: number
          matches_played?: number
          model_id: string
          rating?: number
          wins?: number
        }
        Update: {
          id?: string
          language_id?: string
          last_updated?: string
          losses?: number
          matches_played?: number
          model_id?: string
          rating?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "elo_ratings_by_language_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_ratings_by_language_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_ratings_global: {
        Row: {
          id: string
          last_updated: string
          losses: number
          matches_played: number
          model_id: string
          rating: number
          wins: number
        }
        Insert: {
          id?: string
          last_updated?: string
          losses?: number
          matches_played?: number
          model_id: string
          rating?: number
          wins?: number
        }
        Update: {
          id?: string
          last_updated?: string
          losses?: number
          matches_played?: number
          model_id?: string
          rating?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "elo_ratings_global_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: true
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_ratings_global_model: {
        Row: {
          provider_id: string
          definition_name: string
          rating: number
          matches_played: number
          wins: number
          losses: number
          last_updated: string
        }
        Insert: {
          provider_id: string
          definition_name: string
          rating?: number
          matches_played?: number
          wins?: number
          losses?: number
          last_updated?: string
        }
        Update: {
          provider_id?: string
          definition_name?: string
          rating?: number
          matches_played?: number
          wins?: number
          losses?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "elo_ratings_global_model_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_ratings_by_language_model: {
        Row: {
          provider_id: string
          definition_name: string
          language_id: string
          rating: number
          matches_played: number
          wins: number
          losses: number
          last_updated: string
        }
        Insert: {
          provider_id: string
          definition_name: string
          language_id: string
          rating?: number
          matches_played?: number
          wins?: number
          losses?: number
          last_updated?: string
        }
        Update: {
          provider_id?: string
          definition_name?: string
          language_id?: string
          rating?: number
          matches_played?: number
          wins?: number
          losses?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "elo_ratings_by_language_model_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elo_ratings_by_language_model_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      model_languages: {
        Row: {
          language_id: string
          model_id: string
        }
        Insert: {
          language_id: string
          model_id: string
        }
        Update: {
          language_id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_languages_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_languages_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          created_at: string
          definition_id: string | null
          gender: string
          id: string
          is_active: boolean
          model_id: string
          name: string
          provider_id: string
          tags: string[] | null
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          definition_id?: string | null
          gender: string
          id?: string
          is_active?: boolean
          model_id: string
          name: string
          provider_id: string
          tags?: string[] | null
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          definition_id?: string | null
          gender?: string
          id?: string
          is_active?: boolean
          model_id?: string
          name?: string
          provider_id?: string
          tags?: string[] | null
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "provider_model_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_languages: {
        Row: {
          language_id: string
          provider_id: string
        }
        Insert: {
          language_id: string
          provider_id: string
        }
        Update: {
          language_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_languages_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_languages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_model_definitions: {
        Row: {
          id: string
          provider_id: string
          name: string
          model_id: string
          endpoint: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          name: string
          model_id: string
          endpoint?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          name?: string
          model_id?: string
          endpoint?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_model_definitions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_voices: {
        Row: {
          created_at: string
          display_name: string | null
          gender: string
          id: string
          language_id: string
          model_id: string | null
          provider_id: string
          updated_at: string
          voice_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          gender: string
          id?: string
          language_id: string
          model_id?: string | null
          provider_id: string
          updated_at?: string
          voice_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          gender?: string
          id?: string
          language_id?: string
          model_id?: string | null
          provider_id?: string
          updated_at?: string
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_voices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sentence_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          sentence_id: string
          text: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          sentence_id: string
          text: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          sentence_id?: string
          text?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sentence_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentence_versions_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
        ]
      }
      sentences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          language_id: string
          text: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          language_id: string
          text: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          language_id?: string
          text?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sentences_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      test_events: {
        Row: {
          audio_a_id: string
          audio_b_id: string
          created_at: string
          test_type: string
          elo_after_loser: number | null
          elo_after_winner: number | null
          elo_before_loser: number | null
          elo_before_winner: number | null
          generation_cost: number | null
          id: string
          is_valid: boolean
          language_id: string
          listen_time_a_ms: number | null
          listen_time_b_ms: number | null
          loser_id: string | null
          model_a_id: string
          model_b_id: string
          sentence_id: string
          status: string
          user_id: string
          voted_at: string | null
          winner_id: string | null
        }
        Insert: {
          audio_a_id: string
          audio_b_id: string
          created_at?: string
          test_type?: string
          elo_after_loser?: number | null
          elo_after_winner?: number | null
          elo_before_loser?: number | null
          elo_before_winner?: number | null
          generation_cost?: number | null
          id?: string
          is_valid?: boolean
          language_id: string
          listen_time_a_ms?: number | null
          listen_time_b_ms?: number | null
          loser_id?: string | null
          model_a_id: string
          model_b_id: string
          sentence_id: string
          status?: string
          user_id: string
          voted_at?: string | null
          winner_id?: string | null
        }
        Update: {
          audio_a_id?: string
          audio_b_id?: string
          created_at?: string
          test_type?: string
          elo_after_loser?: number | null
          elo_after_winner?: number | null
          elo_before_loser?: number | null
          elo_before_winner?: number | null
          generation_cost?: number | null
          id?: string
          is_valid?: boolean
          language_id?: string
          listen_time_a_ms?: number | null
          listen_time_b_ms?: number | null
          loser_id?: string | null
          model_a_id?: string
          model_b_id?: string
          sentence_id?: string
          status?: string
          user_id?: string
          voted_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_events_audio_a_id_fkey"
            columns: ["audio_a_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_audio_b_id_fkey"
            columns: ["audio_b_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_model_a_id_fkey"
            columns: ["model_a_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_model_b_id_fkey"
            columns: ["model_b_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "sentences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard_by_language_model: {
        Args: {
          p_language_id: string
          p_provider_id?: string | null
          p_min_matches?: number | null
        }
        Returns: {
          provider_id: string
          definition_name: string
          model_name: string | null
          provider_name: string
          provider_slug: string
          rating: number
          matches_played: number
          wins: number
          losses: number
          last_updated: string
          tags: string[] | null
        }[]
      }
      get_leaderboard_global_model: {
        Args: {
          p_provider_id?: string | null
          p_min_matches?: number | null
        }
        Returns: {
          provider_id: string
          definition_name: string
          model_name: string | null
          provider_name: string
          provider_slug: string
          rating: number
          matches_played: number
          wins: number
          losses: number
          last_updated: string
          tags: string[] | null
        }[]
      }
      get_matchmaking_candidates: {
        Args: { p_language_id: string }
        Returns: {
          model_id: string
          gender: string
          rating: number
          matches_played: number
        }[]
      }
      get_matchmaking_candidates_by_model: {
        Args: { p_language_id: string }
        Returns: {
          provider_id: string
          definition_name: string
          gender: string
          rating: number
          matches_played: number
        }[]
      }
      pick_random_voice_for_definition: {
        Args: {
          p_provider_id: string
          p_definition_name: string
          p_language_id: string
          p_gender?: string
        }
        Returns: string
      }
      get_random_sentence: {
        Args: {
          p_language_id: string
          p_user_id: string
          p_exclude_window?: number
        }
        Returns: { id: string; text: string }[]
      }
      pick_random_voice_for_model: {
        Args: {
          p_provider_id: string
          p_model_id: string
          p_language_id: string
          p_gender?: string
        }
        Returns: string
      }
      process_vote: {
        Args: {
          p_test_event_id: string
          p_winner_id: string
          p_loser_id: string
          p_language_id: string
          p_listen_time_a_ms: number
          p_listen_time_b_ms: number
        }
        Returns: undefined
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
    Enums: {},
  },
} as const
