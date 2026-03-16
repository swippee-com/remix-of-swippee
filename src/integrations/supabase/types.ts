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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string
          created_by: string
          ends_at: string | null
          id: string
          is_active: boolean
          message: string
          starts_at: string
          title: string
          type: Database["public"]["Enums"]["announcement_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          starts_at?: string
          title: string
          type?: Database["public"]["Enums"]["announcement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          starts_at?: string
          title?: string
          type?: Database["public"]["Enums"]["announcement_type"]
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      inventory_balances: {
        Row: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          available_amount: number
          id: string
          is_enabled: boolean
          low_threshold: number
          network: Database["public"]["Enums"]["crypto_network"]
          reserved_amount: number
          updated_at: string
        }
        Insert: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          available_amount?: number
          id?: string
          is_enabled?: boolean
          low_threshold?: number
          network: Database["public"]["Enums"]["crypto_network"]
          reserved_amount?: number
          updated_at?: string
        }
        Update: {
          asset?: Database["public"]["Enums"]["crypto_asset"]
          available_amount?: number
          id?: string
          is_enabled?: boolean
          low_threshold?: number
          network?: Database["public"]["Enums"]["crypto_network"]
          reserved_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          id: string
          kyc_submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          id?: string
          kyc_submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          kyc_submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_kyc_submission_id_fkey"
            columns: ["kyc_submission_id"]
            isOneToOne: false
            referencedRelation: "kyc_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          admin_notes: string | null
          city: string
          country: string
          created_at: string
          date_of_birth: string
          expected_monthly_volume: string | null
          full_legal_name: string
          id: string
          id_number: string
          id_type: string
          nationality: string
          occupation: string
          phone: string
          postal_code: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_of_funds: string
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          admin_notes?: string | null
          city: string
          country?: string
          created_at?: string
          date_of_birth: string
          expected_monthly_volume?: string | null
          full_legal_name: string
          id?: string
          id_number: string
          id_type: string
          nationality?: string
          occupation: string
          phone: string
          postal_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_of_funds: string
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          admin_notes?: string | null
          city?: string
          country?: string
          created_at?: string
          date_of_birth?: string
          expected_monthly_volume?: string | null
          full_legal_name?: string
          id?: string
          id_number?: string
          id_type?: string
          nationality?: string
          occupation?: string
          phone?: string
          postal_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_of_funds?: string
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          account_bucket: Database["public"]["Enums"]["ledger_bucket"]
          amount: number
          asset: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_type: string
          id: string
          reference_id: string | null
          reference_type: string | null
          trade_id: string | null
          user_id: string | null
        }
        Insert: {
          account_bucket: Database["public"]["Enums"]["ledger_bucket"]
          amount: number
          asset?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_type: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          trade_id?: string | null
          user_id?: string | null
        }
        Update: {
          account_bucket?: Database["public"]["Enums"]["ledger_bucket"]
          amount?: number
          asset?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["ledger_direction"]
          entry_type?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          trade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "otc_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          login_method: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          login_method?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          login_method?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_price_snapshots: {
        Row: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          crypto_usd_price: number
          fetched_at: string
          id: string
          source_crypto: string
          source_fx: string
          usd_npr_rate: number
        }
        Insert: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          crypto_usd_price: number
          fetched_at?: string
          id?: string
          source_crypto?: string
          source_fx?: string
          usd_npr_rate: number
        }
        Update: {
          asset?: Database["public"]["Enums"]["crypto_asset"]
          crypto_usd_price?: number
          fetched_at?: string
          id?: string
          source_crypto?: string
          source_fx?: string
          usd_npr_rate?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at: string
          fee_total_npr: number
          final_rate_npr: number
          id: string
          input_amount_crypto: number | null
          input_amount_npr: number | null
          network: Database["public"]["Enums"]["crypto_network"]
          order_type: string
          payment_method_id: string | null
          payout_address_id: string | null
          rate_lock_id: string | null
          requires_manual_review: boolean
          risk_score: number | null
          side: Database["public"]["Enums"]["trade_side"]
          status: Database["public"]["Enums"]["order_status"]
          total_pay_npr: number
          total_receive_crypto: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          fee_total_npr?: number
          final_rate_npr: number
          id?: string
          input_amount_crypto?: number | null
          input_amount_npr?: number | null
          network: Database["public"]["Enums"]["crypto_network"]
          order_type?: string
          payment_method_id?: string | null
          payout_address_id?: string | null
          rate_lock_id?: string | null
          requires_manual_review?: boolean
          risk_score?: number | null
          side: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["order_status"]
          total_pay_npr: number
          total_receive_crypto: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          fee_total_npr?: number
          final_rate_npr?: number
          id?: string
          input_amount_crypto?: number | null
          input_amount_npr?: number | null
          network?: Database["public"]["Enums"]["crypto_network"]
          order_type?: string
          payment_method_id?: string | null
          payout_address_id?: string | null
          rate_lock_id?: string | null
          requires_manual_review?: boolean
          risk_score?: number | null
          side?: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["order_status"]
          total_pay_npr?: number
          total_receive_crypto?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payout_address_id_fkey"
            columns: ["payout_address_id"]
            isOneToOne: false
            referencedRelation: "payout_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rate_lock_id_fkey"
            columns: ["rate_lock_id"]
            isOneToOne: false
            referencedRelation: "rate_locks"
            referencedColumns: ["id"]
          },
        ]
      }
      otc_trades: {
        Row: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          assigned_admin: string | null
          created_at: string
          fee_amount: number
          fiat_currency: string
          gross_amount: number
          id: string
          net_amount: number
          network: Database["public"]["Enums"]["crypto_network"]
          quote_id: string
          quote_request_id: string
          quoted_rate: number
          settlement_notes: string | null
          settlement_references: Json | null
          side: Database["public"]["Enums"]["trade_side"]
          status: Database["public"]["Enums"]["trade_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          assigned_admin?: string | null
          created_at?: string
          fee_amount?: number
          fiat_currency?: string
          gross_amount: number
          id?: string
          net_amount: number
          network: Database["public"]["Enums"]["crypto_network"]
          quote_id: string
          quote_request_id: string
          quoted_rate: number
          settlement_notes?: string | null
          settlement_references?: Json | null
          side: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: Database["public"]["Enums"]["crypto_asset"]
          assigned_admin?: string | null
          created_at?: string
          fee_amount?: number
          fiat_currency?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          network?: Database["public"]["Enums"]["crypto_network"]
          quote_id?: string
          quote_request_id?: string
          quoted_rate?: number
          settlement_notes?: string | null
          settlement_references?: Json | null
          side?: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "otc_trades_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otc_trades_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_holder_name: string
          account_number: string | null
          bank_name: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_method_type"]
          qr_image_path: string | null
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          account_holder_name: string
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_method_type"]
          qr_image_path?: string | null
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_method_type"]
          qr_image_path?: string | null
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          reference_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          trade_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          trade_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          reference_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "otc_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_addresses: {
        Row: {
          address: string
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at: string
          destination_tag: string | null
          id: string
          is_verified: boolean
          is_whitelisted: boolean
          label: string
          network: Database["public"]["Enums"]["crypto_network"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          destination_tag?: string | null
          id?: string
          is_verified?: boolean
          is_whitelisted?: boolean
          label: string
          network: Database["public"]["Enums"]["crypto_network"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          asset?: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          destination_tag?: string | null
          id?: string
          is_verified?: boolean
          is_whitelisted?: boolean
          label?: string
          network?: Database["public"]["Enums"]["crypto_network"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      pricing_configs: {
        Row: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at: string
          fixed_markup_npr: number | null
          id: string
          is_active: boolean
          max_auto_order_npr: number
          min_order_npr: number
          network: Database["public"]["Enums"]["crypto_network"] | null
          network_fee_npr: number
          payment_adjustments: Json
          percent_spread: number | null
          side: Database["public"]["Enums"]["trade_side"] | null
          updated_at: string
        }
        Insert: {
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          fixed_markup_npr?: number | null
          id?: string
          is_active?: boolean
          max_auto_order_npr?: number
          min_order_npr?: number
          network?: Database["public"]["Enums"]["crypto_network"] | null
          network_fee_npr?: number
          payment_adjustments?: Json
          percent_spread?: number | null
          side?: Database["public"]["Enums"]["trade_side"] | null
          updated_at?: string
        }
        Update: {
          asset?: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          fixed_markup_npr?: number | null
          id?: string
          is_active?: boolean
          max_auto_order_npr?: number
          min_order_npr?: number
          network?: Database["public"]["Enums"]["crypto_network"] | null
          network_fee_npr?: number
          payment_adjustments?: Json
          percent_spread?: number | null
          side?: Database["public"]["Enums"]["trade_side"] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_2fa_enabled: boolean | null
          is_frozen: boolean
          phone: string | null
          phone_verified: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_2fa_enabled?: boolean | null
          is_frozen?: boolean
          phone?: string | null
          phone_verified?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_2fa_enabled?: boolean | null
          is_frozen?: boolean
          phone?: string | null
          phone_verified?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotion_events: {
        Row: {
          ad_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["promotion_event_type"]
          id: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["promotion_event_type"]
          id?: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["promotion_event_type"]
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          click_count: number
          created_at: string
          created_by: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          impression_count: number
          is_active: boolean
          link_text: string
          link_url: string
          placement: Database["public"]["Enums"]["promotion_placement"]
          priority: number
          starts_at: string
          title: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_text?: string
          link_url: string
          placement: Database["public"]["Enums"]["promotion_placement"]
          priority?: number
          starts_at?: string
          title: string
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_active?: boolean
          link_text?: string
          link_url?: string
          placement?: Database["public"]["Enums"]["promotion_placement"]
          priority?: number
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          amount_crypto: number | null
          amount_fiat: number | null
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at: string
          fiat_currency: string
          id: string
          network: Database["public"]["Enums"]["crypto_network"]
          notes: string | null
          payout_address_id: string | null
          preferred_payment_method_id: string | null
          side: Database["public"]["Enums"]["trade_side"]
          status: Database["public"]["Enums"]["quote_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_crypto?: number | null
          amount_fiat?: number | null
          asset: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          fiat_currency?: string
          id?: string
          network: Database["public"]["Enums"]["crypto_network"]
          notes?: string | null
          payout_address_id?: string | null
          preferred_payment_method_id?: string | null
          side: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["quote_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_crypto?: number | null
          amount_fiat?: number | null
          asset?: Database["public"]["Enums"]["crypto_asset"]
          created_at?: string
          fiat_currency?: string
          id?: string
          network?: Database["public"]["Enums"]["crypto_network"]
          notes?: string | null
          payout_address_id?: string | null
          preferred_payment_method_id?: string | null
          side?: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["quote_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_payout_address_id_fkey"
            columns: ["payout_address_id"]
            isOneToOne: false
            referencedRelation: "payout_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_preferred_payment_method_id_fkey"
            columns: ["preferred_payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          expires_at: string
          fee_amount: number
          id: string
          internal_note: string | null
          is_accepted: boolean | null
          quote_request_id: string
          quoted_price: number
          settlement_instructions: string | null
          spread_amount: number | null
          total_user_pays: number
          total_user_receives: number
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          fee_amount?: number
          id?: string
          internal_note?: string | null
          is_accepted?: boolean | null
          quote_request_id: string
          quoted_price: number
          settlement_instructions?: string | null
          spread_amount?: number | null
          total_user_pays: number
          total_user_receives: number
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          fee_amount?: number
          id?: string
          internal_note?: string | null
          is_accepted?: boolean | null
          quote_request_id?: string
          quoted_price?: number
          settlement_instructions?: string | null
          spread_amount?: number | null
          total_user_pays?: number
          total_user_receives?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_locks: {
        Row: {
          amount_input_type: string
          amount_input_value: number
          asset: Database["public"]["Enums"]["crypto_asset"]
          base_npr_price: number
          created_at: string
          crypto_usd_price: number
          expires_at: string
          fees_npr: number
          final_rate_npr: number
          id: string
          network: Database["public"]["Enums"]["crypto_network"]
          payment_method:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          pricing_config_id: string | null
          side: Database["public"]["Enums"]["trade_side"]
          status: string
          total_pay: number
          total_receive: number
          usd_npr_rate: number
          user_id: string
        }
        Insert: {
          amount_input_type: string
          amount_input_value: number
          asset: Database["public"]["Enums"]["crypto_asset"]
          base_npr_price: number
          created_at?: string
          crypto_usd_price: number
          expires_at: string
          fees_npr?: number
          final_rate_npr: number
          id?: string
          network: Database["public"]["Enums"]["crypto_network"]
          payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          pricing_config_id?: string | null
          side: Database["public"]["Enums"]["trade_side"]
          status?: string
          total_pay: number
          total_receive: number
          usd_npr_rate: number
          user_id: string
        }
        Update: {
          amount_input_type?: string
          amount_input_value?: number
          asset?: Database["public"]["Enums"]["crypto_asset"]
          base_npr_price?: number
          created_at?: string
          crypto_usd_price?: number
          expires_at?: string
          fees_npr?: number
          final_rate_npr?: number
          id?: string
          network?: Database["public"]["Enums"]["crypto_network"]
          payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          pricing_config_id?: string | null
          side?: Database["public"]["Enums"]["trade_side"]
          status?: string
          total_pay?: number
          total_receive?: number
          usd_npr_rate?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_locks_pricing_config_id_fkey"
            columns: ["pricing_config_id"]
            isOneToOne: false
            referencedRelation: "pricing_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          is_internal: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_internal?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["support_ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["trade_status"] | null
          id: string
          note: string | null
          to_status: Database["public"]["Enums"]["trade_status"]
          trade_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["trade_status"] | null
          id?: string
          note?: string | null
          to_status: Database["public"]["Enums"]["trade_status"]
          trade_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["trade_status"] | null
          id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["trade_status"]
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_status_history_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "otc_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa_secrets: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret?: string
          updated_at?: string
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
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_current: boolean | null
          last_active_at: string | null
          revoked_at: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string | null
          revoked_at?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean | null
          last_active_at?: string | null
          revoked_at?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          admin_note: string | null
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_npr: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_npr?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_npr?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      is_account_frozen: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      announcement_type: "info" | "warning" | "maintenance"
      app_role: "user" | "admin" | "compliance"
      crypto_asset: "USDT" | "BTC" | "ETH" | "USDC"
      crypto_network: "TRC20" | "ERC20" | "BEP20" | "Polygon"
      kyc_status:
        | "not_submitted"
        | "pending_review"
        | "approved"
        | "rejected"
        | "needs_more_info"
      ledger_bucket:
        | "client_receivable"
        | "client_payable"
        | "fees_revenue"
        | "settlement_pending"
        | "otc_inventory"
        | "fiat_clearing"
        | "crypto_clearing"
        | "manual_adjustment"
      ledger_direction: "debit" | "credit"
      notification_type:
        | "kyc_update"
        | "quote_update"
        | "trade_update"
        | "payment_update"
        | "support_update"
        | "system"
      order_status:
        | "draft"
        | "rate_locked"
        | "awaiting_payment"
        | "payment_proof_uploaded"
        | "under_review"
        | "manual_review"
        | "approved_for_settlement"
        | "settlement_in_progress"
        | "completed"
        | "expired"
        | "cancelled"
        | "rejected"
      payment_method_type:
        | "bank_transfer"
        | "esewa"
        | "khalti"
        | "ime_pay"
        | "other"
      promotion_event_type: "impression" | "click"
      promotion_placement:
        | "dashboard_banner"
        | "sidebar"
        | "landing_sponsor"
        | "live_prices"
        | "public_footer"
      quote_request_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "quoted"
        | "awaiting_user_acceptance"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
        | "converted_to_trade"
      support_ticket_status:
        | "open"
        | "pending_user"
        | "pending_admin"
        | "resolved"
        | "closed"
      trade_side: "buy" | "sell"
      trade_status:
        | "pending_settlement"
        | "awaiting_fiat_payment"
        | "payment_proof_uploaded"
        | "fiat_received"
        | "awaiting_crypto_transfer"
        | "crypto_received"
        | "ready_to_release"
        | "completed"
        | "disputed"
        | "cancelled"
        | "failed"
      wallet_tx_status: "pending" | "completed" | "rejected"
      wallet_tx_type:
        | "deposit"
        | "withdrawal"
        | "trade_debit"
        | "trade_credit"
        | "adjustment"
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
      announcement_type: ["info", "warning", "maintenance"],
      app_role: ["user", "admin", "compliance"],
      crypto_asset: ["USDT", "BTC", "ETH", "USDC"],
      crypto_network: ["TRC20", "ERC20", "BEP20", "Polygon"],
      kyc_status: [
        "not_submitted",
        "pending_review",
        "approved",
        "rejected",
        "needs_more_info",
      ],
      ledger_bucket: [
        "client_receivable",
        "client_payable",
        "fees_revenue",
        "settlement_pending",
        "otc_inventory",
        "fiat_clearing",
        "crypto_clearing",
        "manual_adjustment",
      ],
      ledger_direction: ["debit", "credit"],
      notification_type: [
        "kyc_update",
        "quote_update",
        "trade_update",
        "payment_update",
        "support_update",
        "system",
      ],
      order_status: [
        "draft",
        "rate_locked",
        "awaiting_payment",
        "payment_proof_uploaded",
        "under_review",
        "manual_review",
        "approved_for_settlement",
        "settlement_in_progress",
        "completed",
        "expired",
        "cancelled",
        "rejected",
      ],
      payment_method_type: [
        "bank_transfer",
        "esewa",
        "khalti",
        "ime_pay",
        "other",
      ],
      promotion_event_type: ["impression", "click"],
      promotion_placement: [
        "dashboard_banner",
        "sidebar",
        "landing_sponsor",
        "live_prices",
        "public_footer",
      ],
      quote_request_status: [
        "draft",
        "submitted",
        "under_review",
        "quoted",
        "awaiting_user_acceptance",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
        "converted_to_trade",
      ],
      support_ticket_status: [
        "open",
        "pending_user",
        "pending_admin",
        "resolved",
        "closed",
      ],
      trade_side: ["buy", "sell"],
      trade_status: [
        "pending_settlement",
        "awaiting_fiat_payment",
        "payment_proof_uploaded",
        "fiat_received",
        "awaiting_crypto_transfer",
        "crypto_received",
        "ready_to_release",
        "completed",
        "disputed",
        "cancelled",
        "failed",
      ],
      wallet_tx_status: ["pending", "completed", "rejected"],
      wallet_tx_type: [
        "deposit",
        "withdrawal",
        "trade_debit",
        "trade_credit",
        "adjustment",
      ],
    },
  },
} as const
