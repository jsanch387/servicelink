/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client (for use in React components)
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieEncoding: 'raw',
    }
  );
};

export type PaymentAccountOnboardingStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'restricted';

/** JSON value for jsonb columns (Supabase-style). */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Types for our database (we'll expand this as we build out our schema)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          full_name: string | null;
          onboarding_step: number;
          onboarding_status: 'not_started' | 'in_progress' | 'completed';
          created_at: string;
          updated_at: string;
          subscription_tier: string;
          subscription_status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_current_period_end: string | null;
          subscription_cancel_at_period_end: boolean;
          subscription_billing_interval: string | null;
          profile_welcome_modal_seen: boolean;
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          onboarding_step?: number;
          onboarding_status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
          subscription_tier?: string;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_current_period_end?: string | null;
          subscription_cancel_at_period_end?: boolean;
          subscription_billing_interval?: string | null;
          profile_welcome_modal_seen?: boolean;
        };
        Update: {
          user_id?: string;
          full_name?: string | null;
          onboarding_step?: number;
          onboarding_status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
          subscription_tier?: string;
          subscription_status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_current_period_end?: string | null;
          subscription_cancel_at_period_end?: boolean;
          subscription_billing_interval?: string | null;
          profile_welcome_modal_seen?: boolean;
        };
      };
      business_service_areas: {
        Row: {
          id: string;
          business_profile_id: string;
          label: string;
          city: string;
          state_code: string;
          postal_code: string | null;
          country_code: string;
          latitude: number;
          longitude: number;
          radius_miles: number;
          place_type: string | null;
          provider: string;
          provider_place_id: string | null;
          is_primary: boolean;
          is_active: boolean;
          verified_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_profile_id: string;
          label: string;
          city: string;
          state_code: string;
          postal_code?: string | null;
          country_code?: string;
          latitude: number;
          longitude: number;
          radius_miles: number;
          place_type?: string | null;
          provider?: string;
          provider_place_id?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          verified_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_profile_id?: string;
          label?: string;
          city?: string;
          state_code?: string;
          postal_code?: string | null;
          country_code?: string;
          latitude?: number;
          longitude?: number;
          radius_miles?: number;
          place_type?: string | null;
          provider?: string;
          provider_place_id?: string | null;
          is_primary?: boolean;
          is_active?: boolean;
          verified_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_profiles: {
        Row: {
          id: string;
          profile_id: string;
          public_id: string;
          business_name: string;
          business_type: string | null;
          service_area: string | null;
          business_zip: string | null;
          service_location_mode: string;
          shop_street_address: string | null;
          shop_unit: string | null;
          bio: string | null;
          phone_number_call: string | null;
          phone_number_text: string | null;
          logo_path: string | null;
          banner_path: string | null;
          services: any; // JSON array of services
          portfolio: any; // JSON array of portfolio items
          email: string | null;
          website: string | null;
          /** Normalized handles by platform, e.g. `{ instagram, tiktok }`. */
          social_media: {
            instagram?: string;
            tiktok?: string;
          } | null;
          // NEW FIELDS FOR SLUG SYSTEM:
          business_slug: string | null; // Custom URL slug
          business_link: string | null; // Full public URL
          profile_views: number; // Analytics counter
          last_viewed_at: string | null; // Last view timestamp
          last_edited: string;
          created_at: string;
          updated_at: string;
          free_bookings_month: string | null;
          free_bookings_count: number;
          /** When true and owner is Pro, public profile shows Request quote. */
          accept_quote_req: boolean;
          /** Locales offered on the public booking flow link (always includes `en`). */
          public_booking_locales: string[];
          /** Visitor default when opening the booking link (must be in `public_booking_locales`). */
          public_booking_default_locale: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          public_id: string;
          business_name: string;
          business_type?: string | null;
          free_bookings_month?: string | null;
          free_bookings_count?: number;
          service_area?: string | null;
          business_zip?: string | null;
          service_location_mode?: string;
          shop_street_address?: string | null;
          shop_unit?: string | null;
          bio?: string | null;
          phone_number_call?: string | null;
          phone_number_text?: string | null;
          logo_path?: string | null;
          banner_path?: string | null;
          services?: any;
          portfolio?: any;
          email?: string | null;
          website?: string | null;
          social_media?: {
            instagram?: string;
            tiktok?: string;
          } | null;
          // NEW FIELDS FOR SLUG SYSTEM:
          business_slug?: string | null;
          business_link?: string | null;
          profile_views?: number;
          last_viewed_at?: string | null;
          last_edited?: string;
          created_at?: string;
          updated_at?: string;
          accept_quote_req?: boolean;
          public_booking_locales?: string[];
          public_booking_default_locale?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          public_id?: string;
          business_name?: string;
          business_type?: string | null;
          service_area?: string | null;
          business_zip?: string | null;
          service_location_mode?: string;
          shop_street_address?: string | null;
          shop_unit?: string | null;
          bio?: string | null;
          phone_number_call?: string | null;
          phone_number_text?: string | null;
          logo_path?: string | null;
          banner_path?: string | null;
          services?: any;
          portfolio?: any;
          email?: string | null;
          website?: string | null;
          social_media?: {
            instagram?: string;
            tiktok?: string;
          } | null;
          // NEW FIELDS FOR SLUG SYSTEM:
          business_slug?: string | null;
          business_link?: string | null;
          profile_views?: number;
          last_viewed_at?: string | null;
          last_edited?: string;
          created_at?: string;
          updated_at?: string;
          free_bookings_month?: string | null;
          free_bookings_count?: number;
          accept_quote_req?: boolean;
          public_booking_locales?: string[];
          public_booking_default_locale?: string;
        };
      };
      service_addons: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          price_cents: number;
          /** Optional extra time (minutes); null = not specified. Use 30-step grid in app. */
          duration_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          price_cents?: number;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          price_cents?: number;
          duration_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_addon_assignments: {
        Row: {
          service_id: string;
          addon_id: string;
          created_at: string;
        };
        Insert: {
          service_id: string;
          addon_id: string;
          created_at?: string;
        };
        Update: {
          service_id?: string;
          addon_id?: string;
          created_at?: string;
        };
      };
      service_categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      service_price_options: {
        Row: {
          id: string;
          service_id: string;
          business_id: string;
          label: string;
          price_cents: number;
          duration_minutes: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          business_id?: string;
          label: string;
          price_cents?: number;
          duration_minutes: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          business_id?: string;
          label?: string;
          price_cents?: number;
          duration_minutes?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          price_cents: number | null;
          hours_to_complete: number | null;
          duration_minutes: number | null;
          price_options_enabled: boolean;
          is_active: boolean;
          sort_order: number | null;
          category_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          price_cents?: number | null;
          hours_to_complete?: number | null;
          duration_minutes?: number | null;
          price_options_enabled?: boolean;
          is_active?: boolean;
          sort_order?: number | null;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number | null;
          hours_to_complete?: number | null;
          duration_minutes?: number | null;
          price_options_enabled?: boolean;
          is_active?: boolean;
          sort_order?: number | null;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_images: {
        Row: {
          id: string;
          business_id: string;
          storage_path: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          storage_path: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          storage_path?: string;
          position?: number;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          has_completed_onboarding: boolean;
          profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          has_completed_onboarding?: boolean;
          profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          has_completed_onboarding?: boolean;
          profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      booking_requests: {
        Row: {
          id: string;
          business_id: string;
          business_slug: string | null;
          service_id: string | null;
          service_name: string;
          service_price_cents: number | null;
          customer_name: string;
          customer_phone: string;
          preferred_date: string;
          preferred_time_window: 'morning' | 'afternoon' | 'evening';
          message: string | null;
          status: 'pending' | 'approved' | 'declined' | 'cancelled';
          status_updated_at: string | null;
          status_notes: string | null;
          submitted_at: string;
          ip_address: string | null;
          user_agent: string | null;
          referrer_url: string | null;
          notification_sent: boolean;
          notification_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          business_slug?: string | null;
          service_id?: string | null;
          service_name: string;
          service_price_cents?: number | null;
          customer_name: string;
          customer_phone: string;
          preferred_date: string;
          preferred_time_window: 'morning' | 'afternoon' | 'evening';
          message?: string | null;
          status?: 'pending' | 'approved' | 'declined' | 'cancelled';
          status_updated_at?: string | null;
          status_notes?: string | null;
          submitted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer_url?: string | null;
          notification_sent?: boolean;
          notification_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          business_slug?: string | null;
          service_id?: string | null;
          service_name?: string;
          service_price_cents?: number | null;
          customer_name?: string;
          customer_phone?: string;
          preferred_date?: string;
          preferred_time_window?: 'morning' | 'afternoon' | 'evening';
          message?: string | null;
          status?: 'pending' | 'approved' | 'declined' | 'cancelled';
          status_updated_at?: string | null;
          status_notes?: string | null;
          submitted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer_url?: string | null;
          notification_sent?: boolean;
          notification_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          phone_normalized: string | null;
          email_normalized: string | null;
          notes: string | null;
          maintenance_visits_completed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          phone_normalized?: string | null;
          email_normalized?: string | null;
          notes?: string | null;
          maintenance_visits_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          phone_normalized?: string | null;
          email_normalized?: string | null;
          notes?: string | null;
          maintenance_visits_completed?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          reference_type: string;
          reference_id: string;
          title: string;
          body: string | null;
          read: boolean;
          read_at: string | null;
          created_at: string;
          metadata: Json | null;
          dedupe_key: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          reference_type: string;
          reference_id: string;
          title: string;
          body?: string | null;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
          metadata?: Json | null;
          dedupe_key?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          reference_type?: string;
          reference_id?: string;
          title?: string;
          body?: string | null;
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
          metadata?: Json | null;
          dedupe_key?: string | null;
        };
      };
      user_push_tokens: {
        Row: {
          user_id: string;
          expo_push_token: string;
          platform: 'ios' | 'android';
          updated_at: string;
        };
        Insert: {
          user_id: string;
          expo_push_token: string;
          platform: 'ios' | 'android';
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          expo_push_token?: string;
          platform?: 'ios' | 'android';
          updated_at?: string;
        };
      };
      payment_accounts: {
        Row: {
          id: string;
          business_id: string;
          provider: string;
          stripe_account_id: string;
          onboarding_status: PaymentAccountOnboardingStatus;
          charges_enabled: boolean;
          payouts_enabled: boolean;
          details_submitted: boolean;
          requirements_status: string | null;
          connected_at: string | null;
          last_synced_at: string | null;
          stripe_terminal_location_id: string | null;
          tap_to_pay_ready: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          provider?: string;
          stripe_account_id: string;
          onboarding_status?: PaymentAccountOnboardingStatus;
          charges_enabled?: boolean;
          payouts_enabled?: boolean;
          details_submitted?: boolean;
          requirements_status?: string | null;
          connected_at?: string | null;
          last_synced_at?: string | null;
          stripe_terminal_location_id?: string | null;
          tap_to_pay_ready?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          provider?: string;
          stripe_account_id?: string;
          onboarding_status?: PaymentAccountOnboardingStatus;
          charges_enabled?: boolean;
          payouts_enabled?: boolean;
          details_submitted?: boolean;
          requirements_status?: string | null;
          connected_at?: string | null;
          last_synced_at?: string | null;
          stripe_terminal_location_id?: string | null;
          tap_to_pay_ready?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_settings: {
        /** Column order matches Supabase `payment_settings` (see `src/features/payments/docs/DATABASE.md`). */
        Row: {
          id: string;
          business_id: string;
          payment_account_id: string | null;
          checkout_mode: string | null;
          deposits_enabled: boolean;
          deposit_type: string;
          deposit_value: number;
          collect_remaining_balance: boolean;
          currency: string;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          /** When false, ServiceLink checkout is off; Stripe may still be connected. */
          payments_enabled: boolean;
        };
        Insert: {
          id?: string;
          business_id: string;
          payment_account_id?: string | null;
          checkout_mode?: string | null;
          deposits_enabled?: boolean;
          deposit_type?: string;
          deposit_value?: number;
          collect_remaining_balance?: boolean;
          currency?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          payments_enabled?: boolean;
        };
        Update: {
          id?: string;
          business_id?: string;
          payment_account_id?: string | null;
          checkout_mode?: string | null;
          deposits_enabled?: boolean;
          deposit_type?: string;
          deposit_value?: number;
          collect_remaining_balance?: boolean;
          currency?: string;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          payments_enabled?: boolean;
        };
      };
    };
  };
};
