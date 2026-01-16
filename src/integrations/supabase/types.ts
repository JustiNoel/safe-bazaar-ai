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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      county_scams: {
        Row: {
          county_name: string
          created_at: string
          data_source: string | null
          details: Json | null
          id: string
          last_reported_at: string | null
          risk_level: string
          scam_count: number
          scam_type: string
          updated_at: string
        }
        Insert: {
          county_name: string
          created_at?: string
          data_source?: string | null
          details?: Json | null
          id?: string
          last_reported_at?: string | null
          risk_level?: string
          scam_count?: number
          scam_type: string
          updated_at?: string
        }
        Update: {
          county_name?: string
          created_at?: string
          data_source?: string | null
          details?: Json | null
          id?: string
          last_reported_at?: string | null
          risk_level?: string
          scam_count?: number
          scam_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      exec_members: {
        Row: {
          added_by: string
          created_at: string
          email: string
          id: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          email: string
          id?: string
          permissions?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          email?: string
          id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      mpesa_transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          phone_number: string
          plan: string
          result_code: number | null
          result_desc: string | null
          status: string
          transaction_date: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number: string
          plan: string
          result_code?: number | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number?: string
          plan?: string
          result_code?: number | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          authenticity_score: number | null
          created_at: string
          id: string
          image_url: string | null
          price: number | null
          product_name: string | null
          source_platform: string | null
          vendor_name: string | null
        }
        Insert: {
          authenticity_score?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          price?: number | null
          product_name?: string | null
          source_platform?: string | null
          vendor_name?: string | null
        }
        Update: {
          authenticity_score?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          price?: number | null
          product_name?: string | null
          source_platform?: string | null
          vendor_name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          api_calls_today: number | null
          api_key: string | null
          banned: boolean
          banned_at: string | null
          banned_reason: string | null
          bonus_scans: number
          created_at: string
          email_preferences: Json | null
          fcm_token: string | null
          id: string
          last_scan_reset: string | null
          phone: string | null
          premium: boolean
          premium_expires_at: string | null
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          scan_limit: number
          scans_today: number
          seller_verified: boolean | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          voice_readout_enabled: boolean | null
        }
        Insert: {
          api_calls_today?: number | null
          api_key?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_reason?: string | null
          bonus_scans?: number
          created_at?: string
          email_preferences?: Json | null
          fcm_token?: string | null
          id?: string
          last_scan_reset?: string | null
          phone?: string | null
          premium?: boolean
          premium_expires_at?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          scan_limit?: number
          scans_today?: number
          seller_verified?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          voice_readout_enabled?: boolean | null
        }
        Update: {
          api_calls_today?: number | null
          api_key?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_reason?: string | null
          bonus_scans?: number
          created_at?: string
          email_preferences?: Json | null
          fcm_token?: string | null
          id?: string
          last_scan_reset?: string | null
          phone?: string | null
          premium?: boolean
          premium_expires_at?: string | null
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          scan_limit?: number
          scans_today?: number
          seller_verified?: boolean | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          voice_readout_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_awarded: number
          completed_at: string | null
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_awarded?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_awarded?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scan_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          issued_by: string
          reason: string | null
          token_count: number
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by: string
          reason?: string | null
          token_count?: number
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_by?: string
          reason?: string | null
          token_count?: number
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          alternatives: Json | null
          created_at: string
          id: string
          is_guest: boolean | null
          overall_score: number
          product_id: string | null
          risk_breakdown: Json | null
          user_id: string | null
          verdict: string
        }
        Insert: {
          alternatives?: Json | null
          created_at?: string
          id?: string
          is_guest?: boolean | null
          overall_score: number
          product_id?: string | null
          risk_breakdown?: Json | null
          user_id?: string | null
          verdict: string
        }
        Update: {
          alternatives?: Json | null
          created_at?: string
          id?: string
          is_guest?: boolean | null
          overall_score?: number
          product_id?: string | null
          risk_breakdown?: Json | null
          user_id?: string | null
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          payment_method: string
          plan: string
          starts_at: string
          status: string
          stripe_subscription_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at: string
          id?: string
          payment_method: string
          plan: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          payment_method?: string
          plan?: string
          starts_at?: string
          status?: string
          stripe_subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "mpesa_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_api_key: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_daily_scans: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
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
      app_role: ["buyer", "seller", "admin"],
    },
  },
} as const
