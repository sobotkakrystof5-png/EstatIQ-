// Generováno automaticky: npx supabase gen types typescript --project-id mzuhyynwsnypqjvshyrb
// NEUPRAVOVAT RUČNĚ — spusť regeneraci po každé migraci

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
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          expires_at: string | null
          file_size: number | null
          file_url: string
          id: string
          lease_id: string | null
          mime_type: string | null
          name: string
          note: string | null
          notification_sent_days: number[]
          property_id: string | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          expires_at?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          lease_id?: string | null
          mime_type?: string | null
          name: string
          note?: string | null
          notification_sent_days?: number[]
          property_id?: string | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          expires_at?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          lease_id?: string | null
          mime_type?: string | null
          name?: string
          note?: string | null
          notification_sent_days?: number[]
          property_id?: string | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_imports: {
        Row: {
          created_at: string
          filename: string
          id: string
          property_id: string | null
          provider: Database["public"]["Enums"]["energy_provider"] | null
          rows_imported: number
          rows_skipped: number
          rows_total: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          property_id?: string | null
          provider?: Database["public"]["Enums"]["energy_provider"] | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          property_id?: string | null
          provider?: Database["public"]["Enums"]["energy_provider"] | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_imports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_readings: {
        Row: {
          consumption: number | null
          created_at: string
          id: string
          lease_id: string | null
          meter_id: string | null
          note: string | null
          period_month: number
          period_year: number
          photo_url: string | null
          property_id: string
          provider: Database["public"]["Enums"]["energy_provider"] | null
          reading_date: string
          reading_value: number
          type: Database["public"]["Enums"]["energy_type"]
          updated_at: string
        }
        Insert: {
          consumption?: number | null
          created_at?: string
          id?: string
          lease_id?: string | null
          meter_id?: string | null
          note?: string | null
          period_month: number
          period_year: number
          photo_url?: string | null
          property_id: string
          provider?: Database["public"]["Enums"]["energy_provider"] | null
          reading_date: string
          reading_value: number
          type: Database["public"]["Enums"]["energy_type"]
          updated_at?: string
        }
        Update: {
          consumption?: number | null
          created_at?: string
          id?: string
          lease_id?: string | null
          meter_id?: string | null
          note?: string | null
          period_month?: number
          period_year?: number
          photo_url?: string | null
          property_id?: string
          provider?: Database["public"]["Enums"]["energy_provider"] | null
          reading_date?: string
          reading_value?: number
          type?: Database["public"]["Enums"]["energy_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_readings_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "energy_readings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string
          expense_date: string
          id: string
          invoice_number: string | null
          lease_id: string | null
          period_month: number | null
          period_year: number | null
          property_id: string
          receipt_url: string | null
          supplier: string | null
          tax_deductible: Database["public"]["Enums"]["tax_deductible"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description: string
          expense_date: string
          id?: string
          invoice_number?: string | null
          lease_id?: string | null
          period_month?: number | null
          period_year?: number | null
          property_id: string
          receipt_url?: string | null
          supplier?: string | null
          tax_deductible?: Database["public"]["Enums"]["tax_deductible"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_number?: string | null
          lease_id?: string | null
          period_month?: number | null
          period_year?: number | null
          property_id?: string
          receipt_url?: string | null
          supplier?: string | null
          tax_deductible?: Database["public"]["Enums"]["tax_deductible"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          lease_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          lease_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string | null
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          lease_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          archived_at: string | null
          bank_account: string | null
          contract_url: string | null
          created_at: string
          deposit: number
          end_date: string | null
          handover_url: string | null
          id: string
          monthly_rent: number
          payment_day: number
          property_id: string
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          updated_at: string
          utilities_flat: number
          variable_symbol: string | null
        }
        Insert: {
          archived_at?: string | null
          bank_account?: string | null
          contract_url?: string | null
          created_at?: string
          deposit?: number
          end_date?: string | null
          handover_url?: string | null
          id?: string
          monthly_rent: number
          payment_day?: number
          property_id: string
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id: string
          updated_at?: string
          utilities_flat?: number
          variable_symbol?: string | null
        }
        Update: {
          archived_at?: string | null
          bank_account?: string | null
          contract_url?: string | null
          created_at?: string
          deposit?: number
          end_date?: string | null
          handover_url?: string | null
          id?: string
          monthly_rent?: number
          payment_day?: number
          property_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          tenant_id?: string
          updated_at?: string
          utilities_flat?: number
          variable_symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          email_sent_at: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          ref_id: string | null
          ref_table: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          ref_id?: string | null
          ref_table?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          ref_id?: string | null
          ref_table?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invitations_organization_id_fkey"
            columns: ["organization_id"]
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
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          dic: string | null
          email: string | null
          ico: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          dic?: string | null
          email?: string | null
          ico?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          dic?: string | null
          email?: string | null
          ico?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          lease_id: string
          note: string | null
          paid_amount: number | null
          paid_at: string | null
          period_month: number | null
          period_year: number | null
          qr_payload: string | null
          reminder_t_minus5_sent_at: string | null
          reminder_t_plus14_sent_at: string | null
          reminder_t_plus7_sent_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["payment_type"]
          updated_at: string
          variable_symbol: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          lease_id: string
          note?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          period_month?: number | null
          period_year?: number | null
          qr_payload?: string | null
          reminder_t_minus5_sent_at?: string | null
          reminder_t_plus14_sent_at?: string | null
          reminder_t_plus7_sent_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
          variable_symbol?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          lease_id?: string
          note?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          period_month?: number | null
          period_year?: number | null
          qr_payload?: string | null
          reminder_t_minus5_sent_at?: string | null
          reminder_t_plus14_sent_at?: string | null
          reminder_t_plus7_sent_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["payment_type"]
          updated_at?: string
          variable_symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          currency_preference: string
          email: string
          full_name: string | null
          id: string
          locale: string
          onboarding_completed_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          theme_preference: string
          two_factor_enabled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          currency_preference?: string
          email: string
          full_name?: string | null
          id: string
          locale?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme_preference?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          currency_preference?: string
          email?: string
          full_name?: string | null
          id?: string
          locale?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme_preference?: string
          two_factor_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          archived_at: string | null
          area_sqm: number | null
          basement_floors: number | null
          cadastral_number: string | null
          cadastre_lv: string | null
          cadastre_ku: string | null
          cadastre_ku_code: string | null
          cadastre_parcel: string | null
          cadastre_owners: { name: string; share: string }[] | null
          cadastre_encumbrances: string[] | null
          cadastre_refreshed_at: string | null
          city: string
          construction_type: string | null
          country: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          disposition: string | null
          electricity_ean_code: string | null
          equipment: string[]
          floor: number | null
          gas_eic_code: string | null
          heating_type: string | null
          id: string
          insurance_annual_premium: number | null
          insurance_note: string | null
          insurance_policy_number: string | null
          market_value: number | null
          name: string
          organization_id: string | null
          owner_id: string
          ownership_type: string | null
          postal_code: string | null
          purchase_price: number | null
          region: string | null
          rooms: number | null
          status: Database["public"]["Enums"]["property_status"]
          total_floors: number | null
          type: Database["public"]["Enums"]["property_type"]
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          address: string
          archived_at?: string | null
          area_sqm?: number | null
          basement_floors?: number | null
          cadastral_number?: string | null
          cadastre_lv?: string | null
          cadastre_ku?: string | null
          cadastre_ku_code?: string | null
          cadastre_parcel?: string | null
          cadastre_owners?: import('./database').CadastreOwner[] | null
          cadastre_encumbrances?: string[] | null
          cadastre_refreshed_at?: string | null
          city: string
          construction_type?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          disposition?: string | null
          electricity_ean_code?: string | null
          equipment?: string[]
          floor?: number | null
          gas_eic_code?: string | null
          heating_type?: string | null
          id?: string
          insurance_annual_premium?: number | null
          insurance_note?: string | null
          insurance_policy_number?: string | null
          market_value?: number | null
          name: string
          organization_id?: string | null
          owner_id: string
          ownership_type?: string | null
          postal_code?: string | null
          purchase_price?: number | null
          region?: string | null
          rooms?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          total_floors?: number | null
          type?: Database["public"]["Enums"]["property_type"]
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          archived_at?: string | null
          area_sqm?: number | null
          basement_floors?: number | null
          cadastral_number?: string | null
          cadastre_lv?: string | null
          cadastre_ku?: string | null
          cadastre_ku_code?: string | null
          cadastre_parcel?: string | null
          cadastre_owners?: import('./database').CadastreOwner[] | null
          cadastre_encumbrances?: string[] | null
          cadastre_refreshed_at?: string | null
          city?: string
          construction_type?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          disposition?: string | null
          electricity_ean_code?: string | null
          equipment?: string[]
          floor?: number | null
          gas_eic_code?: string | null
          heating_type?: string | null
          id?: string
          insurance_annual_premium?: number | null
          insurance_note?: string | null
          insurance_policy_number?: string | null
          market_value?: number | null
          name?: string
          organization_id?: string | null
          owner_id?: string
          ownership_type?: string | null
          postal_code?: string | null
          purchase_price?: number | null
          region?: string | null
          rooms?: number | null
          status?: Database["public"]["Enums"]["property_status"]
          total_floors?: number | null
          type?: Database["public"]["Enums"]["property_type"]
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          unit_count: number
          unit_limit: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          unit_count?: number
          unit_limit?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          unit_count?: number
          unit_limit?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_exports: {
        Row: {
          created_at: string
          error_message: string | null
          file_url: string | null
          format: Database["public"]["Enums"]["export_format"]
          id: string
          include_expenses: boolean
          include_income: boolean
          property_id: string | null
          status: Database["public"]["Enums"]["export_status"]
          total_deductible: number | null
          total_expenses: number | null
          total_income: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          include_expenses?: boolean
          include_income?: boolean
          property_id?: string | null
          status?: Database["public"]["Enums"]["export_status"]
          total_deductible?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["export_format"]
          id?: string
          include_expenses?: boolean
          include_income?: boolean
          property_id?: string | null
          status?: Database["public"]["Enums"]["export_status"]
          total_deductible?: number | null
          total_expenses?: number | null
          total_income?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_exports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          id_number: string | null
          note: string | null
          owner_id: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          id_number?: string | null
          note?: string | null
          owner_id: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_number?: string | null
          note?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_energy_anomaly: {
        Args: {
          p_consumption: number
          p_month: number
          p_property_id: string
          p_type: Database["public"]["Enums"]["energy_type"]
          p_year: number
        }
        Returns: {
          anomaly_percent: number
          avg_consumption: number
          is_anomaly: boolean
        }[]
      }
      czech_account_to_iban: { Args: { p_account: string }; Returns: string }
      expire_old_invitations: { Args: never; Returns: undefined }
      generate_monthly_payments: {
        Args: { p_month?: number; p_year?: number }
        Returns: Json
      }
      get_expiring_documents: { Args: never; Returns: Json }
      get_payments_t_minus5: { Args: never; Returns: Json }
      get_payments_t_plus14: { Args: never; Returns: Json }
      get_payments_t_plus7: { Args: never; Returns: Json }
      get_resend_api_key: { Args: never; Returns: string }
      mark_document_alert_sent: {
        Args: { p_days: number; p_document_id: string }
        Returns: undefined
      }
      my_organization_ids: { Args: never; Returns: string[] }
      my_property_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      billing_cycle: "monthly" | "yearly"
      document_category:
        | "najemni_smlouva"
        | "predavaci_protokol"
        | "pojistka"
        | "faktura"
        | "korespondence"
        | "revize"
        | "jine"
      energy_provider:
        | "cez"
        | "eon"
        | "pre"
        | "innogy"
        | "prazska_teplarenska"
        | "jiny"
      energy_type:
        | "elektrina"
        | "plyn"
        | "voda_studena"
        | "voda_tepla"
        | "teplo"
      expense_category:
        | "opravy"
        | "pojistne"
        | "sluzby"
        | "sprava"
        | "danove_poplatky"
        | "energie"
        | "reklama"
        | "jine"
      export_format: "pdf" | "csv"
      export_status: "pending" | "processing" | "ready" | "failed"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      lease_status: "aktivni" | "ukoncena" | "ceka_na_podpis" | "archivovana"
      notification_channel: "in_app" | "email" | "both"
      notification_type:
        | "payment_reminder"
        | "payment_overdue"
        | "energy_anomaly"
        | "document_expiry"
        | "lease_expiry"
        | "subscription_limit"
        | "invitation_accepted"
        | "system"
      org_member_role: "admin" | "spravce" | "accountant" | "viewer"
      payment_status: "pending" | "paid" | "overdue" | "canceled"
      payment_type: "rent" | "deposit" | "utilities" | "repair" | "other"
      property_status: "volna" | "pronajata" | "v_oprave" | "archivovana"
      property_type: "byt" | "dum" | "kancelar" | "sklad" | "garaz" | "jine" | "pozemek" | "komercni_prostor"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
      subscription_tier:
        | "free"
        | "starter"
        | "pro"
        | "portfolio"
        | "b2b_start"
        | "b2b_growth"
        | "b2b_scale"
        | "enterprise"
      tax_deductible: "yes" | "no" | "pausal_30"
      user_role:
        | "super_admin"
        | "spravce"
        | "vlastnik"
        | "pronajimatel"
        | "najemnik"
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
      billing_cycle: ["monthly", "yearly"],
      document_category: [
        "najemni_smlouva",
        "predavaci_protokol",
        "pojistka",
        "faktura",
        "korespondence",
        "revize",
        "jine",
      ],
      energy_provider: [
        "cez",
        "eon",
        "pre",
        "innogy",
        "prazska_teplarenska",
        "jiny",
      ],
      energy_type: ["elektrina", "plyn", "voda_studena", "voda_tepla", "teplo"],
      expense_category: [
        "opravy",
        "pojistne",
        "sluzby",
        "sprava",
        "danove_poplatky",
        "energie",
        "reklama",
        "jine",
      ],
      export_format: ["pdf", "csv"],
      export_status: ["pending", "processing", "ready", "failed"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      lease_status: ["aktivni", "ukoncena", "ceka_na_podpis", "archivovana"],
      notification_channel: ["in_app", "email", "both"],
      notification_type: [
        "payment_reminder",
        "payment_overdue",
        "energy_anomaly",
        "document_expiry",
        "lease_expiry",
        "subscription_limit",
        "invitation_accepted",
        "system",
      ],
      org_member_role: ["admin", "spravce", "accountant", "viewer"],
      payment_status: ["pending", "paid", "overdue", "canceled"],
      payment_type: ["rent", "deposit", "utilities", "repair", "other"],
      property_status: ["volna", "pronajata", "v_oprave", "archivovana"],
      property_type: ["byt", "dum", "kancelar", "sklad", "garaz", "jine", "pozemek", "komercni_prostor"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
      subscription_tier: [
        "free",
        "starter",
        "pro",
        "portfolio",
        "b2b_start",
        "b2b_growth",
        "b2b_scale",
        "enterprise",
      ],
      tax_deductible: ["yes", "no", "pausal_30"],
      user_role: [
        "super_admin",
        "spravce",
        "vlastnik",
        "pronajimatel",
        "najemnik",
      ],
    },
  },
} as const
