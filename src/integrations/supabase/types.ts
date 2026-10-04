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
      escrow_orders: {
        Row: {
          buyer_id: string
          created_at: string
          deposit_amount: number
          id: string
          listing_id: string
          seller_id: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          total_amount: number
          virtual_iban: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          deposit_amount: number
          id?: string
          listing_id: string
          seller_id?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          total_amount: number
          virtual_iban?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          deposit_amount?: number
          id?: string
          listing_id?: string
          seller_id?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          total_amount?: number
          virtual_iban?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          age_months: number | null
          birth_date: string | null
          breed: string
          category: string
          city: string
          created_at: string
          description: string | null
          district: string | null
          ear_tag_number: string
          estimated_weight_kg: number | null
          head_count: number
          id: string
          images: string[]
          price_per_head: number
          reels_video_url: string | null
          seller_id: string | null
          seller_name: string
          seller_phone: string | null
          status: Database["public"]["Enums"]["listing_status"]
          thumbnail_url: string | null
          title: string
          total_price: number
          video_url: string | null
        }
        Insert: {
          age_months?: number | null
          birth_date?: string | null
          breed: string
          category: string
          city: string
          created_at?: string
          description?: string | null
          district?: string | null
          ear_tag_number: string
          estimated_weight_kg?: number | null
          head_count?: number
          id?: string
          images?: string[]
          price_per_head: number
          reels_video_url?: string | null
          seller_id?: string | null
          seller_name?: string
          seller_phone?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          thumbnail_url?: string | null
          title: string
          total_price: number
          video_url?: string | null
        }
        Update: {
          age_months?: number | null
          birth_date?: string | null
          breed?: string
          category?: string
          city?: string
          created_at?: string
          description?: string | null
          district?: string | null
          ear_tag_number?: string
          estimated_weight_kg?: number | null
          head_count?: number
          id?: string
          images?: string[]
          price_per_head?: number
          reels_video_url?: string | null
          seller_id?: string | null
          seller_name?: string
          seller_phone?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          thumbnail_url?: string | null
          title?: string
          total_price?: number
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          is_verified: boolean
          phone_number: string | null
          service_cities: string[]
        }
        Insert: {
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id: string
          is_verified?: boolean
          phone_number?: string | null
          service_cities?: string[]
        }
        Update: {
          city?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          is_verified?: boolean
          phone_number?: string | null
          service_cities?: string[]
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
      vet_inspections: {
        Row: {
          created_at: string
          general_condition_score: number | null
          hoof_limb_health: string | null
          id: string
          inspection_date: string
          is_approved: boolean
          listing_id: string
          pregnancy_status: string | null
          respiratory_health: string | null
          respiratory_note: string | null
          scale_ticket_photo_url: string | null
          udder_health: string | null
          vaccination_verified: boolean
          verified_weight_kg: number | null
          vet_id: string | null
          vet_license_no: string | null
          vet_name: string
          vet_notes: string | null
          video_360_url: string | null
        }
        Insert: {
          created_at?: string
          general_condition_score?: number | null
          hoof_limb_health?: string | null
          id?: string
          inspection_date?: string
          is_approved?: boolean
          listing_id: string
          pregnancy_status?: string | null
          respiratory_health?: string | null
          respiratory_note?: string | null
          scale_ticket_photo_url?: string | null
          udder_health?: string | null
          vaccination_verified?: boolean
          verified_weight_kg?: number | null
          vet_id?: string | null
          vet_license_no?: string | null
          vet_name?: string
          vet_notes?: string | null
          video_360_url?: string | null
        }
        Update: {
          created_at?: string
          general_condition_score?: number | null
          hoof_limb_health?: string | null
          id?: string
          inspection_date?: string
          is_approved?: boolean
          listing_id?: string
          pregnancy_status?: string | null
          respiratory_health?: string | null
          respiratory_note?: string | null
          scale_ticket_photo_url?: string | null
          udder_health?: string | null
          vaccination_verified?: boolean
          verified_weight_kg?: number | null
          vet_id?: string | null
          vet_license_no?: string | null
          vet_name?: string
          vet_notes?: string | null
          video_360_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vet_inspections_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "buyer" | "seller" | "vet" | "admin"
      escrow_status:
        | "deposit_pending"
        | "deposit_locked"
        | "vet_approved"
        | "transport_started"
        | "completed"
        | "cancelled"
      listing_status:
        | "draft"
        | "active"
        | "inspection_pending"
        | "inspected"
        | "sold"
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
      app_role: ["buyer", "seller", "vet", "admin"],
      escrow_status: [
        "deposit_pending",
        "deposit_locked",
        "vet_approved",
        "transport_started",
        "completed",
        "cancelled",
      ],
      listing_status: [
        "draft",
        "active",
        "inspection_pending",
        "inspected",
        "sold",
      ],
    },
  },
} as const
