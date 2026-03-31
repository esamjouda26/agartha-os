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
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          created_by: string | null
          id: string
          message: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          priority: string
          target_roles: string[] | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          priority?: string
          target_roles?: string[] | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          priority?: string
          target_roles?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          serial_number: string | null
          status: string
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          asset_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          serial_number?: string | null
          status?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          asset_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          serial_number?: string | null
          status?: string
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_discrepancies: {
        Row: {
          created_at: string | null
          detail: string | null
          id: string
          justification_reason: string | null
          justified_by: string | null
          shift_schedule_id: string | null
          status: Database["public"]["Enums"]["exception_status"] | null
          type: Database["public"]["Enums"]["exception_type"]
        }
        Insert: {
          created_at?: string | null
          detail?: string | null
          id?: string
          justification_reason?: string | null
          justified_by?: string | null
          shift_schedule_id?: string | null
          status?: Database["public"]["Enums"]["exception_status"] | null
          type: Database["public"]["Enums"]["exception_type"]
        }
        Update: {
          created_at?: string | null
          detail?: string | null
          id?: string
          justification_reason?: string | null
          justified_by?: string | null
          shift_schedule_id?: string | null
          status?: Database["public"]["Enums"]["exception_status"] | null
          type?: Database["public"]["Enums"]["exception_type"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_discrepancies_shift_schedule_id_fkey"
            columns: ["shift_schedule_id"]
            isOneToOne: false
            referencedRelation: "shift_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_vectors: {
        Row: {
          booking_ref: string
          created_at: string
          id: string
          vector_hash: string
        }
        Insert: {
          booking_ref: string
          created_at?: string
          id?: string
          vector_hash: string
        }
        Update: {
          booking_ref?: string
          created_at?: string
          id?: string
          vector_hash?: string
        }
        Relationships: []
      }
      booking_attendees: {
        Row: {
          attendee_index: number
          attendee_type: string
          biometric_ref: string | null
          booking_id: string
          created_at: string
          id: string
          nickname: string | null
          updated_at: string | null
        }
        Insert: {
          attendee_index: number
          attendee_type: string
          biometric_ref?: string | null
          booking_id: string
          created_at?: string
          id?: string
          nickname?: string | null
          updated_at?: string | null
        }
        Update: {
          attendee_index?: number
          attendee_type?: string
          biometric_ref?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          nickname?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_attendees_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          gateway_ref: string | null
          id: string
          method: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          gateway_ref?: string | null
          id?: string
          method: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          gateway_ref?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          adult_count: number
          auto_capture_opt: boolean
          booker_email: string | null
          booker_name: string | null
          booking_ref: string | null
          cancelled_at: string | null
          checked_in_at: string | null
          child_count: number
          created_at: string
          experience_id: string
          face_pay_enabled: boolean
          id: string
          is_used: boolean
          promo_code_id: string | null
          qr_code_ref: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          tier_name: string
          time_slot_id: string
          total_price: number
          updated_at: string | null
        }
        Insert: {
          adult_count?: number
          auto_capture_opt?: boolean
          booker_email?: string | null
          booker_name?: string | null
          booking_ref?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          child_count?: number
          created_at?: string
          experience_id: string
          face_pay_enabled?: boolean
          id?: string
          is_used?: boolean
          promo_code_id?: string | null
          qr_code_ref?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tier_name: string
          time_slot_id: string
          total_price: number
          updated_at?: string | null
        }
        Update: {
          adult_count?: number
          auto_capture_opt?: boolean
          booker_email?: string | null
          booker_name?: string | null
          booking_ref?: string | null
          cancelled_at?: string | null
          checked_in_at?: string | null
          child_count?: number
          created_at?: string
          experience_id?: string
          face_pay_enabled?: boolean
          id?: string
          is_used?: boolean
          promo_code_id?: string | null
          qr_code_ref?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tier_name?: string
          time_slot_id?: string
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          channel: string | null
          clicks: number | null
          conversions: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          impressions: number | null
          name: string
          spend: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          channel?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name: string
          spend?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          channel?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name?: string
          spend?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      crew_locations: {
        Row: {
          id: string
          left_at: string | null
          scanned_at: string
          staff_record_id: string
          zone_id: string
        }
        Insert: {
          id?: string
          left_at?: string | null
          scanned_at?: string
          staff_record_id: string
          zone_id: string
        }
        Update: {
          id?: string
          left_at?: string | null
          scanned_at?: string
          staff_record_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_locations_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_locations_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          actual_guests: number | null
          confidence: number | null
          created_at: string
          created_by: string | null
          forecast_date: string
          id: string
          notes: string | null
          predicted_guests: number
          updated_at: string | null
        }
        Insert: {
          actual_guests?: number | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          forecast_date: string
          id?: string
          notes?: string | null
          predicted_guests: number
          updated_at?: string | null
        }
        Update: {
          actual_guests?: number | null
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          forecast_date?: string
          id?: string
          notes?: string | null
          predicted_guests?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          asset_tag_id: string | null
          commission_date: string | null
          created_at: string
          created_by: string | null
          device_type: string
          firmware_version: string | null
          id: string
          ip_address: unknown
          last_heartbeat: string | null
          mac_address: unknown
          manufacturer: string | null
          metadata: Json | null
          model_sku: string | null
          name: string
          port_number: number | null
          serial_number: string | null
          spares_available: number | null
          status: Database["public"]["Enums"]["device_status"]
          switch_id: string | null
          updated_at: string | null
          vlan_id: number | null
          warranty_expiry: string | null
          zone_id: string | null
        }
        Insert: {
          asset_tag_id?: string | null
          commission_date?: string | null
          created_at?: string
          created_by?: string | null
          device_type: string
          firmware_version?: string | null
          id?: string
          ip_address?: unknown
          last_heartbeat?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          metadata?: Json | null
          model_sku?: string | null
          name: string
          port_number?: number | null
          serial_number?: string | null
          spares_available?: number | null
          status?: Database["public"]["Enums"]["device_status"]
          switch_id?: string | null
          updated_at?: string | null
          vlan_id?: number | null
          warranty_expiry?: string | null
          zone_id?: string | null
        }
        Update: {
          asset_tag_id?: string | null
          commission_date?: string | null
          created_at?: string
          created_by?: string | null
          device_type?: string
          firmware_version?: string | null
          id?: string
          ip_address?: unknown
          last_heartbeat?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          metadata?: Json | null
          model_sku?: string | null
          name?: string
          port_number?: number | null
          serial_number?: string | null
          spares_available?: number | null
          status?: Database["public"]["Enums"]["device_status"]
          switch_id?: string | null
          updated_at?: string | null
          vlan_id?: number | null
          warranty_expiry?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_switch_id_fkey"
            columns: ["switch_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_tiers: {
        Row: {
          created_at: string
          duration_minutes: number
          experience_id: string
          id: string
          perks: string[]
          price: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          experience_id: string
          id?: string
          perks?: string[]
          price: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          experience_id?: string
          id?: string
          perks?: string[]
          price?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_tiers_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_experience_tiers_template"
            columns: ["tier_name"]
            isOneToOne: false
            referencedRelation: "tier_templates"
            referencedColumns: ["name"]
          },
        ]
      }
      experiences: {
        Row: {
          arrival_window_minutes: number
          capacity_per_slot: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          max_facility_capacity: number
          name: string
          updated_at: string | null
        }
        Insert: {
          arrival_window_minutes?: number
          capacity_per_slot?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_facility_capacity: number
          name: string
          updated_at?: string | null
        }
        Update: {
          arrival_window_minutes?: number
          capacity_per_slot?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_facility_capacity?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fnb_menu_items: {
        Row: {
          allergens: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          linked_product_id: string | null
          menu_category:
            | Database["public"]["Enums"]["fnb_menu_category_enum"]
            | null
          name: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          linked_product_id?: string | null
          menu_category?:
            | Database["public"]["Enums"]["fnb_menu_category_enum"]
            | null
          name: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          linked_product_id?: string | null
          menu_category?:
            | Database["public"]["Enums"]["fnb_menu_category_enum"]
            | null
          name?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fnb_menu_items_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fnb_order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fnb_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "fnb_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fnb_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "fnb_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fnb_orders: {
        Row: {
          booking_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          prepared_by: string | null
          status: Database["public"]["Enums"]["fnb_order_status"]
          total_amount: number | null
          updated_at: string | null
          zone_label: string | null
        }
        Insert: {
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          prepared_by?: string | null
          status?: Database["public"]["Enums"]["fnb_order_status"]
          total_amount?: number | null
          updated_at?: string | null
          zone_label?: string | null
        }
        Update: {
          booking_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          prepared_by?: string | null
          status?: Database["public"]["Enums"]["fnb_order_status"]
          total_amount?: number | null
          updated_at?: string | null
          zone_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fnb_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      fnb_recipes: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          product_id: string
          quantity_required: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          product_id: string
          quantity_required: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          product_id?: string
          quantity_required?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fnb_recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "fnb_menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fnb_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fnb_waste_log: {
        Row: {
          created_at: string
          disposed_by: string | null
          id: string
          menu_item_id: string
          notes: string | null
          quantity: number
          reason: Database["public"]["Enums"]["waste_reason"]
        }
        Insert: {
          created_at?: string
          disposed_by?: string | null
          id?: string
          menu_item_id: string
          notes?: string | null
          quantity: number
          reason: Database["public"]["Enums"]["waste_reason"]
        }
        Update: {
          created_at?: string
          disposed_by?: string | null
          id?: string
          menu_item_id?: string
          notes?: string | null
          quantity?: number
          reason?: Database["public"]["Enums"]["waste_reason"]
        }
        Relationships: [
          {
            foreignKeyName: "fnb_waste_log_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "fnb_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_profiles: {
        Row: {
          auto_capture_opt: boolean
          biometric_ref: string | null
          created_at: string
          email: string
          face_pay_enabled: boolean
          full_name: string
          id: string
          nationality: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_capture_opt?: boolean
          biometric_ref?: string | null
          created_at?: string
          email: string
          face_pay_enabled?: boolean
          full_name: string
          id?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_capture_opt?: boolean
          biometric_ref?: string | null
          created_at?: string
          email?: string
          face_pay_enabled?: boolean
          full_name?: string
          id?: string
          nationality?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      iam_requests: {
        Row: {
          created_at: string
          created_by: string | null
          current_role: Database["public"]["Enums"]["staff_role"] | null
          hr_remark: string | null
          id: string
          it_remark: string | null
          request_type: Database["public"]["Enums"]["iam_request_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          staff_record_id: string | null
          status: Database["public"]["Enums"]["iam_request_status"]
          target_role: Database["public"]["Enums"]["staff_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_role?: Database["public"]["Enums"]["staff_role"] | null
          hr_remark?: string | null
          id?: string
          it_remark?: string | null
          request_type: Database["public"]["Enums"]["iam_request_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_record_id?: string | null
          status?: Database["public"]["Enums"]["iam_request_status"]
          target_role?: Database["public"]["Enums"]["staff_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_role?: Database["public"]["Enums"]["staff_role"] | null
          hr_remark?: string | null
          id?: string
          it_remark?: string | null
          request_type?: Database["public"]["Enums"]["iam_request_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_record_id?: string | null
          status?: Database["public"]["Enums"]["iam_request_status"]
          target_role?: Database["public"]["Enums"]["staff_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iam_requests_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          attachment_url: string | null
          category: Database["public"]["Enums"]["incident_category"]
          created_at: string
          created_by: string | null
          description: string
          id: string
          logged_by: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          attachment_url?: string | null
          category: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          logged_by: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          logged_by?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audit_items: {
        Row: {
          actual_qty: number | null
          audit_id: string
          counted_by: string | null
          created_at: string
          expected_qty: number | null
          id: string
          photo_url: string | null
          product_id: string
          status: Database["public"]["Enums"]["audit_request_status"]
          updated_at: string | null
        }
        Insert: {
          actual_qty?: number | null
          audit_id: string
          counted_by?: string | null
          created_at?: string
          expected_qty?: number | null
          id?: string
          photo_url?: string | null
          product_id: string
          status?: Database["public"]["Enums"]["audit_request_status"]
          updated_at?: string | null
        }
        Update: {
          actual_qty?: number | null
          audit_id?: string
          counted_by?: string | null
          created_at?: string
          expected_qty?: number | null
          id?: string
          photo_url?: string | null
          product_id?: string
          status?: Database["public"]["Enums"]["audit_request_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "inventory_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_audit_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audits: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location_id: string
          notes: string | null
          scheduled_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id: string
          notes?: string | null
          scheduled_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          scheduled_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ledger: {
        Row: {
          created_at: string
          id: string
          location_id: string
          performed_by: string | null
          product_id: string
          quantity_delta: number
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          performed_by?: string | null
          product_id: string
          quantity_delta: number
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          performed_by?: string | null
          product_id?: string
          quantity_delta?: number
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ledger_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_ledger_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfer_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          transfer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          transfer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "inventory_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          assigned_runner_id: string | null
          created_at: string
          created_by: string | null
          dest_location_id: string
          id: string
          notes: string | null
          source_location_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          updated_at: string | null
        }
        Insert: {
          assigned_runner_id?: string | null
          created_at?: string
          created_by?: string | null
          dest_location_id: string
          id?: string
          notes?: string | null
          source_location_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          updated_at?: string | null
        }
        Update: {
          assigned_runner_id?: string | null
          created_at?: string
          created_by?: string | null
          dest_location_id?: string
          id?: string
          notes?: string | null
          source_location_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_dest_location_id_fkey"
            columns: ["dest_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          staff_record_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          type: Database["public"]["Enums"]["leave_type"]
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          staff_record_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          type: Database["public"]["Enums"]["leave_type"]
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          staff_record_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          type?: Database["public"]["Enums"]["leave_type"]
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          allowed_categories:
            | Database["public"]["Enums"]["product_category_enum"][]
            | null
          can_hold_inventory: boolean | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_fnb_default: boolean | null
          is_retail_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          allowed_categories?:
            | Database["public"]["Enums"]["product_category_enum"][]
            | null
          can_hold_inventory?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_fnb_default?: boolean | null
          is_retail_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          allowed_categories?:
            | Database["public"]["Enums"]["product_category_enum"][]
            | null
          can_hold_inventory?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_fnb_default?: boolean | null
          is_retail_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_work_orders: {
        Row: {
          assigned_sponsor_id: string | null
          authorized_by: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          federated_group_claim: string | null
          id: string
          mad_limit_minutes: number
          maintenance_end: string
          maintenance_start: string
          scope: string | null
          status: Database["public"]["Enums"]["wo_status"]
          switch_port_id: string | null
          target_ci_id: string
          topology: Database["public"]["Enums"]["wo_topology"]
          updated_at: string | null
          vendor_id: string
          vendor_mac_address: unknown
        }
        Insert: {
          assigned_sponsor_id?: string | null
          authorized_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          federated_group_claim?: string | null
          id?: string
          mad_limit_minutes?: number
          maintenance_end: string
          maintenance_start: string
          scope?: string | null
          status?: Database["public"]["Enums"]["wo_status"]
          switch_port_id?: string | null
          target_ci_id: string
          topology: Database["public"]["Enums"]["wo_topology"]
          updated_at?: string | null
          vendor_id: string
          vendor_mac_address?: unknown
        }
        Update: {
          assigned_sponsor_id?: string | null
          authorized_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          federated_group_claim?: string | null
          id?: string
          mad_limit_minutes?: number
          maintenance_end?: string
          maintenance_start?: string
          scope?: string | null
          status?: Database["public"]["Enums"]["wo_status"]
          switch_port_id?: string | null
          target_ci_id?: string
          topology?: Database["public"]["Enums"]["wo_topology"]
          updated_at?: string | null
          vendor_id?: string
          vendor_mac_address?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_work_orders_assigned_sponsor_id_fkey"
            columns: ["assigned_sponsor_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_work_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_restock_log: {
        Row: {
          created_at: string
          id: string
          location_id: string
          photo_url: string | null
          product_id: string
          quantity: number
          restocked_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          photo_url?: string | null
          product_id: string
          quantity: number
          restocked_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          photo_url?: string | null
          product_id?: string
          quantity?: number
          restocked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_restock_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_restock_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_constraints: {
        Row: {
          applies_to_date: string | null
          constraint_type: string
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          start_time: string | null
          updated_at: string | null
          zone_id: string | null
        }
        Insert: {
          applies_to_date?: string | null
          constraint_type: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          start_time?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Update: {
          applies_to_date?: string | null
          constraint_type?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          start_time?: string | null
          updated_at?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_constraints_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_challenges: {
        Row: {
          attempts: number
          booking_ref: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          otp_code: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          booking_ref: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          otp_code: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          booking_ref?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      product_stock_levels: {
        Row: {
          created_at: string
          current_qty: number
          id: string
          location_id: string
          max_qty: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          current_qty?: number
          id?: string
          location_id: string
          max_qty?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          current_qty?: number
          id?: string
          location_id?: string
          max_qty?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          cost_price: number | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          product_category:
            | Database["public"]["Enums"]["product_category_enum"]
            | null
          reorder_point: number
          sku: string | null
          supplier_id: string | null
          unit_of_measure:
            | Database["public"]["Enums"]["unit_of_measure_enum"]
            | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_category?:
            | Database["public"]["Enums"]["product_category_enum"]
            | null
          reorder_point?: number
          sku?: string | null
          supplier_id?: string | null
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure_enum"]
            | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          cost_price?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_category?:
            | Database["public"]["Enums"]["product_category_enum"]
            | null
          reorder_point?: number
          sku?: string | null
          supplier_id?: string | null
          unit_of_measure?:
            | Database["public"]["Enums"]["unit_of_measure_enum"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          employee_id: string | null
          employment_status: Database["public"]["Enums"]["employment_status"]
          id: string
          password_set: boolean
          staff_record_id: string | null
          staff_role: Database["public"]["Enums"]["staff_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          employee_id?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          id: string
          password_set?: boolean
          staff_record_id?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          employee_id?: string | null
          employment_status?: Database["public"]["Enums"]["employment_status"]
          id?: string
          password_set?: boolean
          staff_record_id?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: true
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          campaign_id: string | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          max_uses: number | null
          status: Database["public"]["Enums"]["promo_status"]
          updated_at: string | null
          valid_from: string
          valid_to: string
        }
        Insert: {
          campaign_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          max_uses?: number | null
          status?: Database["public"]["Enums"]["promo_status"]
          updated_at?: string | null
          valid_from: string
          valid_to: string
        }
        Update: {
          campaign_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_uses?: number | null
          status?: Database["public"]["Enums"]["promo_status"]
          updated_at?: string | null
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          barcode: string | null
          created_at: string
          expected_qty: number
          id: string
          item_name: string
          photo_proof_url: string | null
          po_id: string
          product_id: string | null
          received_qty: number
          unit: string | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          expected_qty: number
          id?: string
          item_name: string
          photo_proof_url?: string | null
          po_id: string
          product_id?: string | null
          received_qty?: number
          unit?: string | null
        }
        Update: {
          barcode?: string | null
          created_at?: string
          expected_qty?: number
          id?: string
          item_name?: string
          photo_proof_url?: string | null
          po_id?: string
          product_id?: string | null
          received_qty?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          export_format: string
          file_url: string | null
          granularity: string
          id: string
          metric: string
          report_name: string
          requested_by: string | null
          row_count: number | null
          status: string
          timeframe: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          export_format?: string
          file_url?: string | null
          granularity?: string
          id?: string
          metric: string
          report_name: string
          requested_by?: string | null
          row_count?: number | null
          status?: string
          timeframe: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          export_format?: string
          file_url?: string | null
          granularity?: string
          id?: string
          metric?: string
          report_name?: string
          requested_by?: string | null
          row_count?: number | null
          status?: string
          timeframe?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          export_format: string
          id: string
          is_active: boolean
          last_run_at: string | null
          metric: string
          next_run_at: string | null
          recipients: string[]
          report_name: string
          schedule_cron: string
          timeframe: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_format?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          metric: string
          next_run_at?: string | null
          recipients?: string[]
          report_name: string
          schedule_cron: string
          timeframe?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_format?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          metric?: string
          next_run_at?: string | null
          recipients?: string[]
          report_name?: string
          schedule_cron?: string
          timeframe?: string
          updated_at?: string
        }
        Relationships: []
      }
      restock_tasks: {
        Row: {
          assigned_to: string | null
          batch_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          delivery_photo_url: string | null
          id: string
          location_id: string
          needed_qty: number
          priority: Database["public"]["Enums"]["restock_priority"]
          product_id: string
          status: Database["public"]["Enums"]["restock_status"]
          updated_at: string | null
          zone_scan_proof: string | null
        }
        Insert: {
          assigned_to?: string | null
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivery_photo_url?: string | null
          id?: string
          location_id: string
          needed_qty: number
          priority?: Database["public"]["Enums"]["restock_priority"]
          product_id: string
          status?: Database["public"]["Enums"]["restock_status"]
          updated_at?: string | null
          zone_scan_proof?: string | null
        }
        Update: {
          assigned_to?: string | null
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          delivery_photo_url?: string | null
          id?: string
          location_id?: string
          needed_qty?: number
          priority?: Database["public"]["Enums"]["restock_priority"]
          product_id?: string
          status?: Database["public"]["Enums"]["restock_status"]
          updated_at?: string | null
          zone_scan_proof?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restock_tasks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_catalog: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          linked_product_id: string
          selling_price: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          linked_product_id: string
          selling_price: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          linked_product_id?: string
          selling_price?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retail_catalog_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          quantity: number
          retail_catalog_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          quantity: number
          retail_catalog_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          quantity?: number
          retail_catalog_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "retail_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "retail_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retail_order_items_retail_catalog_id_fkey"
            columns: ["retail_catalog_id"]
            isOneToOne: false
            referencedRelation: "retail_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      retail_orders: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          status: string | null
          total_amount: number | null
          zone_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          status?: string | null
          total_amount?: number | null
          zone_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          status?: string | null
          total_amount?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retail_orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_dictionary: {
        Row: {
          code: string
          color: string | null
          end_time: string | null
          id: string
          is_day_off: boolean
          start_time: string | null
        }
        Insert: {
          code: string
          color?: string | null
          end_time?: string | null
          id?: string
          is_day_off?: boolean
          start_time?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          end_time?: string | null
          id?: string
          is_day_off?: boolean
          start_time?: string | null
        }
        Relationships: []
      }
      shift_schedules: {
        Row: {
          actual_hours: number | null
          clock_in: string | null
          clock_in_location: string | null
          clock_in_photo: string | null
          clock_out: string | null
          clock_out_location: string | null
          clock_out_photo: string | null
          created_at: string | null
          expected_end_time: string | null
          expected_start_time: string | null
          id: string
          justified_hours: number | null
          linked_leave_id: string | null
          shift_date: string
          shift_dictionary_id: string | null
          staff_record_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          clock_in?: string | null
          clock_in_location?: string | null
          clock_in_photo?: string | null
          clock_out?: string | null
          clock_out_location?: string | null
          clock_out_photo?: string | null
          created_at?: string | null
          expected_end_time?: string | null
          expected_start_time?: string | null
          id?: string
          justified_hours?: number | null
          linked_leave_id?: string | null
          shift_date: string
          shift_dictionary_id?: string | null
          staff_record_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          clock_in?: string | null
          clock_in_location?: string | null
          clock_in_photo?: string | null
          clock_out?: string | null
          clock_out_location?: string | null
          clock_out_photo?: string | null
          created_at?: string | null
          expected_end_time?: string | null
          expected_start_time?: string | null
          id?: string
          justified_hours?: number | null
          linked_leave_id?: string | null
          shift_date?: string
          shift_dictionary_id?: string | null
          staff_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_linked_leave_id_fkey"
            columns: ["linked_leave_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_shift_dictionary_id_fkey"
            columns: ["shift_dictionary_id"]
            isOneToOne: false
            referencedRelation: "shift_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_records: {
        Row: {
          address: string | null
          bank_account_enc: string | null
          bank_name: string | null
          contract_end: string | null
          contract_start: string
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          kin_name: string | null
          kin_phone: string | null
          kin_relationship: string | null
          legal_name: string
          national_id_enc: string | null
          personal_email: string
          phone: string | null
          salary_enc: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_account_enc?: string | null
          bank_name?: string | null
          contract_end?: string | null
          contract_start: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          kin_name?: string | null
          kin_phone?: string | null
          kin_relationship?: string | null
          legal_name: string
          national_id_enc?: string | null
          personal_email: string
          phone?: string | null
          salary_enc?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_account_enc?: string | null
          bank_name?: string | null
          contract_end?: string | null
          contract_start?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          kin_name?: string | null
          kin_phone?: string | null
          kin_relationship?: string | null
          legal_name?: string
          national_id_enc?: string | null
          personal_email?: string
          phone?: string | null
          salary_enc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_records_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          booking_id: string | null
          channel: string | null
          created_at: string
          feedback_text: string | null
          guest_id: string | null
          id: string
          keywords: string[] | null
          nps_score: number | null
          overall_score: number | null
          sentiment: string | null
          survey_type: string
        }
        Insert: {
          booking_id?: string | null
          channel?: string | null
          created_at?: string
          feedback_text?: string | null
          guest_id?: string | null
          id?: string
          keywords?: string[] | null
          nps_score?: number | null
          overall_score?: number | null
          sentiment?: string | null
          survey_type: string
        }
        Update: {
          booking_id?: string | null
          channel?: string | null
          created_at?: string
          feedback_text?: string | null
          guest_id?: string | null
          id?: string
          keywords?: string[] | null
          nps_score?: number | null
          overall_score?: number | null
          sentiment?: string | null
          survey_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string
          source: string
          tags: Json | null
          unit: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string
          source?: string
          tags?: Json | null
          unit?: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string
          source?: string
          tags?: Json | null
          unit?: string
        }
        Relationships: []
      }
      tier_templates: {
        Row: {
          base_duration_minutes: number
          base_perks: string[]
          base_price: number
          created_at: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          base_duration_minutes?: number
          base_perks?: string[]
          base_price?: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          base_duration_minutes?: number
          base_perks?: string[]
          base_price?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          booked_count: number
          created_at: string
          end_time: string
          experience_id: string
          id: string
          is_active: boolean
          override_capacity: number | null
          slot_date: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          booked_count?: number
          created_at?: string
          end_time: string
          experience_id: string
          id?: string
          is_active?: boolean
          override_capacity?: number | null
          slot_date: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          booked_count?: number
          created_at?: string
          end_time?: string
          experience_id?: string
          id?: string
          is_active?: boolean
          override_capacity?: number | null
          slot_date?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          plate: string | null
          status: string
          updated_at: string | null
          vehicle_type: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          plate?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          plate?: string | null
          status?: string
          updated_at?: string | null
          vehicle_type?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      vlans: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          vlan_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          vlan_id: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          vlan_id?: number
        }
        Relationships: []
      }
      weekly_patterns: {
        Row: {
          day_of_week: number
          id: string
          shift_dictionary_id: string | null
          staff_record_id: string | null
        }
        Insert: {
          day_of_week: number
          id?: string
          shift_dictionary_id?: string | null
          staff_record_id?: string | null
        }
        Update: {
          day_of_week?: number
          id?: string
          shift_dictionary_id?: string | null
          staff_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_patterns_shift_dictionary_id_fkey"
            columns: ["shift_dictionary_id"]
            isOneToOne: false
            referencedRelation: "shift_dictionary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_patterns_staff_record_id_fkey"
            columns: ["staff_record_id"]
            isOneToOne: false
            referencedRelation: "staff_records"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_telemetry: {
        Row: {
          co2_level: number | null
          current_occupancy: number | null
          humidity: number | null
          id: string
          recorded_at: string
          temperature: number | null
          zone_id: string
        }
        Insert: {
          co2_level?: number | null
          current_occupancy?: number | null
          humidity?: number | null
          id?: string
          recorded_at?: string
          temperature?: number | null
          zone_id: string
        }
        Update: {
          co2_level?: number | null
          current_occupancy?: number | null
          humidity?: number | null
          id?: string
          recorded_at?: string
          temperature?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_telemetry_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          location_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          location_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          location_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_mfa: {
        Args: { mfa_enabled: boolean; target_user_id: string }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          p_staff_role?: Database["public"]["Enums"]["staff_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      admin_toggle_lock: {
        Args: {
          lock_reason?: string
          should_lock: boolean
          target_user_id: string
        }
        Returns: undefined
      }
      can_read_audit: { Args: { p_entity_type: string }; Returns: boolean }
      execute_nightly_attendance_sweep: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_crew: { Args: never; Returns: boolean }
      is_management: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      jwt_role: { Args: never; Returns: string }
      resolve_incident: {
        Args: { p_attachment_url?: string; p_incident_id: string }
        Returns: undefined
      }
      rpc_complete_pos_order: {
        Args: { p_booking_id?: string; p_items: Json; p_zone_label?: string }
        Returns: Json
      }
      rpc_create_booking: {
        Args: {
          p_adult_count: number
          p_auto_capture?: boolean
          p_booker_email: string
          p_booker_name: string
          p_child_count: number
          p_experience_id: string
          p_face_pay?: boolean
          p_promo_code?: string
          p_tier_name: string
          p_time_slot_id: string
        }
        Returns: Json
      }
      rpc_generate_time_slots: {
        Args: {
          p_day_end_hour?: number
          p_day_start_hour?: number
          p_days: number
          p_experience_id: string
          p_slot_interval_minutes?: number
          p_start_date: string
        }
        Returns: Json
      }
      rpc_get_booking_by_ref: { Args: { p_booking_ref: string }; Returns: Json }
      rpc_get_booking_identity: {
        Args: { p_booking_ref: string; p_ip_address?: unknown }
        Returns: Json
      }
      rpc_scan_crew_badge: {
        Args: { p_device_serial: string; p_employee_id: string }
        Returns: Json
      }
      rpc_scan_ticket: { Args: { p_qr_code_ref: string }; Returns: Json }
      rpc_verify_otp: {
        Args: { p_booking_ref: string; p_otp_code: string }
        Returns: Json
      }
      rpc_wipe_biometric_data: {
        Args: { p_booking_ref: string }
        Returns: Json
      }
      update_laf_status: {
        Args: {
          p_incident_id: string
          p_new_category?: string
          p_new_status: string
        }
        Returns: undefined
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "open" | "resolved"
      alert_type:
        | "auth_security"
        | "broadcast"
        | "system"
        | "technical_maintenance"
      audit_request_status: "pending" | "completed" | "recount_required"
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "refunded"
      campaign_status: "draft" | "active" | "completed" | "archived"
      check_in_status: "on_time" | "late"
      device_status: "online" | "offline" | "maintenance" | "decommissioned"
      employment_status:
        | "active"
        | "pending"
        | "on_leave"
        | "suspended"
        | "terminated"
      exception_status: "unresolved" | "justified" | "unjustified"
      exception_type:
        | "late_arrival"
        | "early_departure"
        | "missing_checkin"
        | "missing_checkout"
        | "absent"
      fnb_menu_category_enum:
        | "hot_food"
        | "snacks_and_sides"
        | "hot_beverage"
        | "cold_beverage"
        | "bakery_and_dessert"
        | "combos"
        | "uncategorized"
      fnb_order_status: "preparing" | "completed" | "cancelled"
      fulfillment_type_enum: "direct_link" | "recipe_bom"
      iam_request_status: "pending_it" | "approved" | "rejected"
      iam_request_type: "provisioning" | "transfer" | "termination"
      incident_category:
        | "biohazard"
        | "altercation"
        | "medical"
        | "equipment"
        | "safety"
        | "spill"
        | "guest_complaint"
        | "fire"
        | "structural"
        | "power_outage"
        | "lost_property"
        | "found_property"
        | "lost_child"
        | "ticketing_issue"
        | "crowd_congestion"
        | "other"
        | "theft"
        | "damaged_merchandise"
        | "pos_failure"
        | "contaminated_food"
        | "food_waste"
        | "damaged_in_transit"
        | "missing_items"
        | "vehicle_issue"
        | "vip_issue"
        | "schedule_delay"
        | "prop_damage"
        | "guest_injury"
        | "lost_and_found"
        | "lost_report"
        | "found_report"
        | "unauthorized_access"
        | "suspicious_package"
        | "medical_emergency"
        | "heat_exhaustion"
        | "safety_hazard"
        | "restroom_restock"
        | "vandalism"
        | "hardware_failure"
        | "network_outage"
      incident_status: "open" | "resolved"
      leave_status: "pending" | "approved" | "rejected"
      leave_type: "annual" | "medical" | "emergency" | "unpaid"
      maintenance_priority: "low" | "medium" | "high" | "critical"
      maintenance_wo_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "pending_mac"
        | "active_mab"
        | "revoked"
      menu_item_category: "prepared_item" | "prepackaged" | "retail" | "drink"
      menu_item_status: "available" | "out_of_stock"
      payment_method_enum: "cash" | "card" | "face_id"
      po_status:
        | "pending"
        | "sent"
        | "partially_received"
        | "completed"
        | "cancelled"
      prep_batch_status: "in_progress" | "cooling" | "completed"
      product_category_enum:
        | "raw_ingredient"
        | "prepackaged_fnb"
        | "retail_merch"
        | "consumable"
      promo_status: "draft" | "active" | "paused" | "expired"
      restock_priority: "normal" | "high" | "critical"
      restock_status: "pending" | "in_progress" | "completed"
      staff_role:
        | "it_admin"
        | "business_admin"
        | "fnb_manager"
        | "merch_manager"
        | "maintenance_manager"
        | "inventory_manager"
        | "marketing_manager"
        | "human_resources_manager"
        | "compliance_manager"
        | "operations_manager"
        | "fnb_crew"
        | "service_crew"
        | "giftshop_crew"
        | "runner_crew"
        | "security_crew"
        | "health_crew"
        | "cleaning_crew"
        | "experience_crew"
        | "internal_maintainence_crew"
      transfer_status:
        | "draft"
        | "pending_runner"
        | "in_transit"
        | "completed"
        | "cancelled"
      unit_of_measure_enum: "piece" | "kg" | "liter" | "box" | "pack"
      waste_reason:
        | "expired_eod"
        | "dropped_spilled"
        | "contaminated"
        | "prep_error"
      wo_status: "draft" | "scheduled" | "active" | "completed" | "revoked"
      wo_topology: "remote" | "onsite"
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
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["open", "resolved"],
      alert_type: [
        "auth_security",
        "broadcast",
        "system",
        "technical_maintenance",
      ],
      audit_request_status: ["pending", "completed", "recount_required"],
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "refunded",
      ],
      campaign_status: ["draft", "active", "completed", "archived"],
      check_in_status: ["on_time", "late"],
      device_status: ["online", "offline", "maintenance", "decommissioned"],
      employment_status: [
        "active",
        "pending",
        "on_leave",
        "suspended",
        "terminated",
      ],
      exception_status: ["unresolved", "justified", "unjustified"],
      exception_type: [
        "late_arrival",
        "early_departure",
        "missing_checkin",
        "missing_checkout",
        "absent",
      ],
      fnb_menu_category_enum: [
        "hot_food",
        "snacks_and_sides",
        "hot_beverage",
        "cold_beverage",
        "bakery_and_dessert",
        "combos",
        "uncategorized",
      ],
      fnb_order_status: ["preparing", "completed", "cancelled"],
      fulfillment_type_enum: ["direct_link", "recipe_bom"],
      iam_request_status: ["pending_it", "approved", "rejected"],
      iam_request_type: ["provisioning", "transfer", "termination"],
      incident_category: [
        "biohazard",
        "altercation",
        "medical",
        "equipment",
        "safety",
        "spill",
        "guest_complaint",
        "fire",
        "structural",
        "power_outage",
        "lost_property",
        "found_property",
        "lost_child",
        "ticketing_issue",
        "crowd_congestion",
        "other",
        "theft",
        "damaged_merchandise",
        "pos_failure",
        "contaminated_food",
        "food_waste",
        "damaged_in_transit",
        "missing_items",
        "vehicle_issue",
        "vip_issue",
        "schedule_delay",
        "prop_damage",
        "guest_injury",
        "lost_and_found",
        "lost_report",
        "found_report",
        "unauthorized_access",
        "suspicious_package",
        "medical_emergency",
        "heat_exhaustion",
        "safety_hazard",
        "restroom_restock",
        "vandalism",
        "hardware_failure",
        "network_outage",
      ],
      incident_status: ["open", "resolved"],
      leave_status: ["pending", "approved", "rejected"],
      leave_type: ["annual", "medical", "emergency", "unpaid"],
      maintenance_priority: ["low", "medium", "high", "critical"],
      maintenance_wo_status: [
        "open",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
        "pending_mac",
        "active_mab",
        "revoked",
      ],
      menu_item_category: ["prepared_item", "prepackaged", "retail", "drink"],
      menu_item_status: ["available", "out_of_stock"],
      payment_method_enum: ["cash", "card", "face_id"],
      po_status: [
        "pending",
        "sent",
        "partially_received",
        "completed",
        "cancelled",
      ],
      prep_batch_status: ["in_progress", "cooling", "completed"],
      product_category_enum: [
        "raw_ingredient",
        "prepackaged_fnb",
        "retail_merch",
        "consumable",
      ],
      promo_status: ["draft", "active", "paused", "expired"],
      restock_priority: ["normal", "high", "critical"],
      restock_status: ["pending", "in_progress", "completed"],
      staff_role: [
        "it_admin",
        "business_admin",
        "fnb_manager",
        "merch_manager",
        "maintenance_manager",
        "inventory_manager",
        "marketing_manager",
        "human_resources_manager",
        "compliance_manager",
        "operations_manager",
        "fnb_crew",
        "service_crew",
        "giftshop_crew",
        "runner_crew",
        "security_crew",
        "health_crew",
        "cleaning_crew",
        "experience_crew",
        "internal_maintainence_crew",
      ],
      transfer_status: [
        "draft",
        "pending_runner",
        "in_transit",
        "completed",
        "cancelled",
      ],
      unit_of_measure_enum: ["piece", "kg", "liter", "box", "pack"],
      waste_reason: [
        "expired_eod",
        "dropped_spilled",
        "contaminated",
        "prep_error",
      ],
      wo_status: ["draft", "scheduled", "active", "completed", "revoked"],
      wo_topology: ["remote", "onsite"],
    },
  },
} as const
