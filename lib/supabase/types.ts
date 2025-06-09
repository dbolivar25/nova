export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          journal_entry_id: string | null
          message_content: string
          message_role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          journal_entry_id?: string | null
          message_content: string
          message_role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          journal_entry_id?: string | null
          message_content?: string
          message_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          freeform_text: string | null
          id: string
          mood: Database["public"]["Enums"]["mood_type"] | null
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          freeform_text?: string | null
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"] | null
          updated_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          freeform_text?: string | null
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"] | null
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_text: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_text?: string
        }
        Relationships: []
      }
      prompt_responses: {
        Row: {
          created_at: string | null
          id: string
          journal_entry_id: string
          prompt_id: string
          response_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          journal_entry_id: string
          prompt_id: string
          response_text?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          journal_entry_id?: string
          prompt_id?: string
          response_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_responses_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_responses_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "journal_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personality: {
        Row: {
          analysis_version: number | null
          created_at: string | null
          id: string
          last_analysis_date: string | null
          traits: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_version?: number | null
          created_at?: string | null
          id?: string
          last_analysis_date?: string | null
          traits?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_version?: number | null
          created_at?: string | null
          id?: string
          last_analysis_date?: string | null
          traits?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_personality_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_dark_mode: boolean | null
          created_at: string | null
          daily_reminder_enabled: boolean | null
          id: string
          prompt_count: number | null
          reminder_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_dark_mode?: boolean | null
          created_at?: string | null
          daily_reminder_enabled?: boolean | null
          id?: string
          prompt_count?: number | null
          reminder_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_dark_mode?: boolean | null
          created_at?: string | null
          daily_reminder_enabled?: boolean | null
          id?: string
          prompt_count?: number | null
          reminder_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clerk_id: string
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          clerk_id: string
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          clerk_id?: string
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_insights: {
        Row: {
          created_at: string | null
          id: string
          insight_content: Json
          insight_type: Database["public"]["Enums"]["insight_type"]
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight_content: Json
          insight_type: Database["public"]["Enums"]["insight_type"]
          user_id: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insight_content?: Json
          insight_type?: Database["public"]["Enums"]["insight_type"]
          user_id?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      insight_type:
        | "emotional_trends"
        | "key_themes"
        | "growth_moments"
        | "patterns"
      mood_type:
        | "positive"
        | "neutral"
        | "negative"
        | "thoughtful"
        | "grateful"
        | "anxious"
        | "excited"
        | "sad"
        | "angry"
        | "peaceful"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      insight_type: [
        "emotional_trends",
        "key_themes",
        "growth_moments",
        "patterns",
      ],
      mood_type: [
        "positive",
        "neutral",
        "negative",
        "thoughtful",
        "grateful",
        "anxious",
        "excited",
        "sad",
        "angry",
        "peaceful",
      ],
    },
  },
} as const

