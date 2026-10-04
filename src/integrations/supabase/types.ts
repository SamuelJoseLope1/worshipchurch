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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      broadcast_destinations: {
        Row: {
          account: string | null
          config: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          org_id: string
          platform: string
        }
        Insert: {
          account?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          org_id: string
          platform: string
        }
        Update: {
          account?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          org_id?: string
          platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_destinations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          director_id: string
          id: string
          name: string
          org_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          director_id?: string
          id?: string
          name: string
          org_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          director_id?: string
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_presets: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_presets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      setlist_items: {
        Row: {
          created_at: string
          id: string
          org_id: string
          overrides: Json
          position: number
          setlist_id: string
          song_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          overrides?: Json
          position?: number
          setlist_id: string
          song_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          overrides?: Json
          position?: number
          setlist_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_items_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          org_id: string
          service_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          org_id: string
          service_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          org_id?: string
          service_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlists_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album: string | null
          arrangements: Json
          artist: string | null
          author: string | null
          bpm: number
          categories: string[]
          created_at: string
          created_by: string | null
          cues: Json
          description: string | null
          duration_sec: number | null
          favorite: boolean
          id: string
          image_path: string | null
          lyrics: string
          markers: Json
          org_id: string
          song_key: string
          tags: string[]
          time_signature: string
          title: string
          updated_at: string
        }
        Insert: {
          album?: string | null
          arrangements?: Json
          artist?: string | null
          author?: string | null
          bpm?: number
          categories?: string[]
          created_at?: string
          created_by?: string | null
          cues?: Json
          description?: string | null
          duration_sec?: number | null
          favorite?: boolean
          id?: string
          image_path?: string | null
          lyrics?: string
          markers?: Json
          org_id: string
          song_key?: string
          tags?: string[]
          time_signature?: string
          title: string
          updated_at?: string
        }
        Update: {
          album?: string | null
          arrangements?: Json
          artist?: string | null
          author?: string | null
          bpm?: number
          categories?: string[]
          created_at?: string
          created_by?: string | null
          cues?: Json
          description?: string | null
          duration_sec?: number | null
          favorite?: boolean
          id?: string
          image_path?: string | null
          lyrics?: string
          markers?: Json
          org_id?: string
          song_key?: string
          tags?: string[]
          time_signature?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stems: {
        Row: {
          color: string
          created_at: string
          file_name: string | null
          file_size: number | null
          group_name: string
          id: string
          mime_type: string | null
          muted: boolean
          name: string
          org_id: string
          output: string
          pan: number
          song_id: string
          sort_order: number
          stem_type: string
          storage_path: string | null
          volume: number
        }
        Insert: {
          color?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          group_name?: string
          id?: string
          mime_type?: string | null
          muted?: boolean
          name: string
          org_id: string
          output?: string
          pan?: number
          song_id: string
          sort_order?: number
          stem_type?: string
          storage_path?: string | null
          volume?: number
        }
        Update: {
          color?: string
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          group_name?: string
          id?: string
          mime_type?: string | null
          muted?: boolean
          name?: string
          org_id?: string
          output?: string
          pan?: number
          song_id?: string
          sort_order?: number
          stem_type?: string
          storage_path?: string | null
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "stems_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stems_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_org_role: {
        Args: {
          _org: string
          _roles: Database["public"]["Enums"]["org_role"][]
          _uid: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string; _uid: string }; Returns: boolean }
    }
    Enums: {
      org_role:
        | "owner"
        | "admin"
        | "director"
        | "musician"
        | "operator"
        | "presenter"
        | "viewer"
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
    Enums: {
      org_role: [
        "owner",
        "admin",
        "director",
        "musician",
        "operator",
        "presenter",
        "viewer",
      ],
    },
  },
} as const
