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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          row_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor?: string | null
          at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          row_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor?: string | null
          at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      booking_sources: {
        Row: {
          active: boolean
          code: string
          color: string
          label: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          color?: string
          label: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          color?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      bookings: {
        Row: {
          adults: number
          check_in: string
          check_out: string
          children: number
          code: string
          created_at: string
          created_by: string | null
          due_date: string | null
          guest_id: string | null
          id: string
          legacy_ref: string | null
          needs_review: boolean
          notes: string | null
          ota_reference: string | null
          source_code: string
          status: string
          total_amount: number
          unit_id: number
          updated_at: string
        }
        Insert: {
          adults?: number
          check_in: string
          check_out: string
          children?: number
          code?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          guest_id?: string | null
          id?: string
          legacy_ref?: string | null
          needs_review?: boolean
          notes?: string | null
          ota_reference?: string | null
          source_code: string
          status?: string
          total_amount: number
          unit_id: number
          updated_at?: string
        }
        Update: {
          adults?: number
          check_in?: string
          check_out?: string
          children?: number
          code?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          guest_id?: string | null
          id?: string
          legacy_ref?: string | null
          needs_review?: boolean
          notes?: string | null
          ota_reference?: string | null
          source_code?: string
          status?: string
          total_amount?: number
          unit_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "booking_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          id_photo_path: string | null
          id_type: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          id_photo_path?: string | null
          id_type?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          id_photo_path?: string | null
          id_type?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          method: string
          notes: string | null
          paid_on: string
          reference: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          method: string
          notes?: string | null
          paid_on?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string
          notes?: string | null
          paid_on?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      room_occupancy: {
        Row: {
          block_id: string | null
          booking_id: string | null
          id: number
          room_id: number
          stay: unknown
        }
        Insert: {
          block_id?: string | null
          booking_id?: string | null
          id?: number
          room_id: number
          stay: unknown
        }
        Update: {
          block_id?: string | null
          booking_id?: string | null
          id?: number
          room_id?: number
          stay?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "room_occupancy_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "unit_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupancy_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupancy_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_occupancy_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          role: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      unit_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          reason: string
          start_date: string
          unit_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          reason: string
          start_date: string
          unit_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          reason?: string
          start_date?: string
          unit_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "unit_blocks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean
          default_rate: number | null
          group_label: string
          id: number
          kind: string
          name: string
          parent_id: number | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          default_rate?: number | null
          group_label: string
          id?: number
          kind: string
          name: string
          parent_id?: number | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          default_rate?: number | null
          group_label?: string
          id?: number
          kind?: string
          name?: string
          parent_id?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "units_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_overview: {
        Row: {
          adults: number | null
          balance: number | null
          check_in: string | null
          check_out: string | null
          children: number | null
          code: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          guest_id: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_tags: string[] | null
          id: string | null
          legacy_ref: string | null
          needs_review: boolean | null
          nights: number | null
          notes: string | null
          ota_reference: string | null
          paid: number | null
          payment_status: string | null
          source_code: string | null
          status: string | null
          total_amount: number | null
          unit_id: number | null
          unit_kind: string | null
          unit_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_source_code_fkey"
            columns: ["source_code"]
            isOneToOne: false
            referencedRelation: "booking_sources"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "bookings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      available_units: {
        Args: { p_exclude_booking?: string; p_from: string; p_to: string }
        Returns: {
          active: boolean
          default_rate: number | null
          group_label: string
          id: number
          kind: string
          name: string
          parent_id: number | null
          sort_order: number
        }[]
        SetofOptions: {
          from: "*"
          to: "units"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_manager: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      report_by_source: {
        Args: { p_from: string; p_to: string }
        Returns: {
          bookings: number
          color: string
          label: string
          nights: number
          revenue: number
          source_code: string
        }[]
      }
      report_daily: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          paid_app: number
          paid_cash: number
          paid_other: number
          paid_transfer: number
          revenue: number
          rooms_blocked: number
          rooms_occupied: number
          rooms_total: number
        }[]
      }
      reset_booking_code_seq: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

