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
      agencies: {
        Row: {
          branding: Json
          cname_domain: string | null
          cname_status: string
          cname_verified_at: string | null
          created_at: string
          id: string
          master_tenant_id: string
          name: string
          quota_pool: number
          updated_at: string
        }
        Insert: {
          branding?: Json
          cname_domain?: string | null
          cname_status?: string
          cname_verified_at?: string | null
          created_at?: string
          id?: string
          master_tenant_id: string
          name: string
          quota_pool?: number
          updated_at?: string
        }
        Update: {
          branding?: Json
          cname_domain?: string | null
          cname_status?: string
          cname_verified_at?: string | null
          created_at?: string
          id?: string
          master_tenant_id?: string
          name?: string
          quota_pool?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agencies_master_tenant_id_fkey"
            columns: ["master_tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_llm_credentials: {
        Row: {
          agency_id: string
          created_at: string
          encrypted_key: string
          provider: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          encrypted_key: string
          provider: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          encrypted_key?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_llm_credentials_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_tenants: {
        Row: {
          agency_id: string
          created_at: string
          quota_allocation: number
          quota_granted: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          quota_allocation?: number
          quota_granted?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          quota_allocation?: number
          quota_granted?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_tenants_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          device_info: string | null
          end_time: string
          id: string
          issue_description: string | null
          organization_id: string
          service_id: string
          start_time: string
          status: string
          provider_payment_intent_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          device_info?: string | null
          end_time: string
          id?: string
          issue_description?: string | null
          organization_id: string
          service_id: string
          start_time: string
          status?: string
          provider_payment_intent_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          device_info?: string | null
          end_time?: string
          id?: string
          issue_description?: string | null
          organization_id?: string
          service_id?: string
          start_time?: string
          status?: string
          provider_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          organization_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          organization_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          organization_id: string
          role: string
          session_id: string
          sources: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          organization_id: string
          role: string
          session_id: string
          sources?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          session_id?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          title: string | null
          updated_at: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          title?: string | null
          updated_at?: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          title?: string | null
          updated_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          amount: number
          contract_url: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          organization_id: string
          paid_at: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_url?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          organization_id: string
          paid_at?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_url?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          organization_id?: string
          paid_at?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_projects: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          live_url: string | null
          name: string
          notes: string | null
          organization_id: string
          repo_url: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          live_url?: string | null
          name: string
          notes?: string | null
          organization_id: string
          repo_url?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          live_url?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          repo_url?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string
          id: string
          metadata: Json
          organization_id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding: string | number[]
          id?: string
          metadata?: Json
          organization_id: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | number[]
          id?: string
          metadata?: Json
          organization_id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          byte_size: number | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          mime_type: string | null
          organization_id: string
          source_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          byte_size?: number | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          organization_id: string
          source_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          byte_size?: number | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          organization_id?: string
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_tasks: {
        Row: {
          column_status: string
          created_at: string
          description: string | null
          id: string
          related_client_project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          column_status?: string
          created_at?: string
          description?: string | null
          id?: string
          related_client_project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          column_status?: string
          created_at?: string
          description?: string | null
          id?: string
          related_client_project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_tasks_related_client_project_id_fkey"
            columns: ["related_client_project_id"]
            isOneToOne: false
            referencedRelation: "client_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["membership_role"]
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_range: string | null
          company: string | null
          created_at: string
          deadline: string | null
          email: string
          full_name: string
          id: string
          kind: string
          message: string | null
          organization_id: string
          phone: string | null
          project_category: string | null
          project_scope: string | null
          source: string | null
          status: string
          updated_at: string
          working_mode: string | null
        }
        Insert: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          deadline?: string | null
          email: string
          full_name: string
          id?: string
          kind: string
          message?: string | null
          organization_id: string
          phone?: string | null
          project_category?: string | null
          project_scope?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          working_mode?: string | null
        }
        Update: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          deadline?: string | null
          email?: string
          full_name?: string
          id?: string
          kind?: string
          message?: string | null
          organization_id?: string
          phone?: string | null
          project_category?: string | null
          project_scope?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          working_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          name: string
          plan_id: string | null
          slug: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          subscription_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          name: string
          plan_id?: string | null
          slug: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          name?: string
          plan_id?: string | null
          slug?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: boolean
          operator_organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: boolean
          operator_organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: boolean
          operator_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_operator_organization_id_fkey"
            columns: ["operator_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          portal_kind: Database["public"]["Enums"]["portal_kind"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          portal_kind?: Database["public"]["Enums"]["portal_kind"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          portal_kind?: Database["public"]["Enums"]["portal_kind"]
          updated_at?: string
        }
        Relationships: []
      }
      saas_subscriptions: {
        Row: {
          api_key_hash: string | null
          created_at: string
          id: string
          license_key: string
          organization_id: string
          seats: number
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string
          id?: string
          license_key?: string
          organization_id: string
          seats?: number
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string
          id?: string
          license_key?: string
          organization_id?: string
          seats?: number
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_connections: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          provider: Database["public"]["Enums"]["sso_provider"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          provider: Database["public"]["Enums"]["sso_provider"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          provider?: Database["public"]["Enums"]["sso_provider"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sso_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_quotas: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          period_start: string
          tokens_limit: number
          tokens_used: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          period_start?: string
          tokens_limit?: number
          tokens_used?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          period_start?: string
          tokens_limit?: number
          tokens_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_quotas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          current_period_end: string | null
          id: string
          name: string
          plan_id: string | null
          slug: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          subscription_status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization: {
        Args: { org_name: string; org_slug: string }
        Returns: {
          created_at: string
          current_period_end: string | null
          id: string
          name: string
          plan_id: string | null
          slug: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          subscription_status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_role: {
        Args: { org_id: string }
        Returns: Database["public"]["Enums"]["membership_role"]
      }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
      match_document_chunks: {
        Args: {
          match_count?: number
          match_organization_id: string
          match_threshold?: number
          query_embedding: string | number[]
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          similarity: number
        }[]
      }
      get_bookable_service: {
        Args: { p_organization_id: string; p_service_id: string }
        Returns: {
          id: string
          organization_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      get_organization_booking_info: {
        Args: { p_organization_id: string }
        Returns: { name: string; slug: string }[]
      }
      is_organization_serviceable: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      get_availability_windows: {
        Args: { p_organization_id: string; p_day_of_week: number }
        Returns: {
          id: string
          organization_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
          created_at: string
        }[]
      }
      get_appointment_conflicts: {
        Args: {
          p_organization_id: string
          p_range_start: string
          p_range_end: string
        }
        Returns: { start_time: string; end_time: string }[]
      }
      create_pending_appointment: {
        Args: {
          p_organization_id: string
          p_service_id: string
          p_customer_name: string
          p_customer_email: string
          p_customer_phone: string | null
          p_device_info: string | null
          p_issue_description: string | null
          p_start_time: string
        }
        Returns: {
          id: string
          organization_id: string
          service_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          device_info: string | null
          issue_description: string | null
          start_time: string
          end_time: string
          status: string
          provider_payment_intent_id: string | null
          created_at: string
        }
      }
      confirm_pending_appointment: {
        Args: { p_organization_id: string; p_appointment_id: string }
        Returns: {
          id: string
          organization_id: string
          service_id: string
          customer_name: string
          customer_email: string
          customer_phone: string | null
          device_info: string | null
          issue_description: string | null
          start_time: string
          end_time: string
          status: string
          provider_payment_intent_id: string | null
          created_at: string
        }
      }
      get_appointment_details: {
        Args: { p_appointment_id: string; p_organization_id: string }
        Returns: {
          appointment: {
            id: string
            organization_id: string
            service_id: string
            customer_name: string
            customer_email: string
            customer_phone: string | null
            device_info: string | null
            issue_description: string | null
            start_time: string
            end_time: string
            status: string
            provider_payment_intent_id: string | null
            created_at: string
          }
          service_name: string
          organization_name: string
        }[]
      }
      get_chat_session_for_org: {
        Args: { p_organization_id: string; p_session_id: string }
        Returns: {
          id: string
          organization_id: string
          visitor_id: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
      }
      create_chat_session: {
        Args: { p_organization_id: string }
        Returns: {
          id: string
          organization_id: string
          visitor_id: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
      }
      get_chat_history: {
        Args: { p_organization_id: string; p_session_id: string }
        Returns: {
          id: string
          organization_id: string
          session_id: string
          role: string
          content: string
          sources: Json | null
          created_at: string
        }[]
      }
      insert_chat_message: {
        Args: {
          p_organization_id: string
          p_session_id: string
          p_role: string
          p_content: string
          p_sources?: Json | null
        }
        Returns: {
          id: string
          organization_id: string
          session_id: string
          role: string
          content: string
          sources: Json | null
          created_at: string
        }
      }
      is_operator_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      submit_lead: {
        Args: {
          p_kind: string
          p_full_name: string
          p_email: string
          p_phone: string | null
          p_company: string | null
          p_project_category: string | null
          p_working_mode: string | null
          p_project_scope: string | null
          p_message: string | null
          p_source: string | null
        }
        Returns: string
      }
      write_audit_log: {
        Args: {
          p_action: string
          p_organization_id: string | null
          p_actor_id: string | null
          p_target_table: string | null
          p_target_id: string | null
          p_metadata: Json | null
        }
        Returns: string
      }
      increment_token_usage: {
        Args: { p_organization_id: string; p_tokens: number }
        Returns: undefined
      }
      is_agency_admin: {
        Args: { p_agency_id: string }
        Returns: boolean
      }
      is_agency_admin_of_tenant: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      consume_agency_quota: {
        Args: { p_tenant_id: string; p_tokens: number }
        Returns: number
      }
      get_my_agency: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          cname_domain: string | null
          cname_status: string
          cname_verified_at: string | null
          branding: Json
          master_tenant_id: string
          quota_pool: number
        }[]
      }
      allocate_agency_tenant_quota: {
        Args: { p_agency_id: string; p_tenant_id: string; p_total: number }
        Returns: number
      }
      link_agency_tenant: {
        Args: { p_agency_id: string; p_tenant_id: string }
        Returns: undefined
      }
      create_agency_tenant: {
        Args: { p_agency_id: string; p_name: string; p_slug: string }
        Returns: string
      }
      unlink_agency_tenant: {
        Args: { p_agency_id: string; p_tenant_id: string }
        Returns: undefined
      }
      get_agency_usage_summary: {
        Args: { p_agency_id: string; p_days?: number }
        Returns: {
          tenant_id: string
          tenant_name: string
          tenant_slug: string
          quota_granted: number
          quota_allocation: number
          rag_requests: number
          completions: number
          low_confidence: number
          quota_exhausted: number
          last_activity_at: string | null
        }[]
      }
      get_agency_by_domain: {
        Args: { p_domain: string }
        Returns: {
          id: string
          master_tenant_id: string
          branding: Json
        }[]
      }
    }
    Enums: {
      membership_role: "owner" | "admin" | "member"
      portal_kind: "operator" | "tenant"
      sso_provider: "okta" | "google_workspace"
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
      membership_role: ["owner", "admin", "member"],
      portal_kind: ["operator", "tenant"],
      sso_provider: ["okta", "google_workspace"],
    },
  },
} as const
