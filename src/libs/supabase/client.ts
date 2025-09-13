import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client (for use in React components)
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

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
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          onboarding_step?: number;
          onboarding_status?: 'not_started' | 'in_progress' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string | null;
          onboarding_step?: number;
          onboarding_status?: 'not_started' | 'in_progress' | 'completed';
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
          bio: string | null;
          phone_number_call: string | null;
          phone_number_text: string | null;
          logo_path: string | null;
          banner_path: string | null;
          services: any; // JSON array of services
          portfolio: any; // JSON array of portfolio items
          email: string | null;
          website: string | null;
          social_media: any; // JSON object for social media links
          last_edited: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          public_id: string;
          business_name: string;
          business_type?: string | null;
          service_area?: string | null;
          bio?: string | null;
          phone_number_call?: string | null;
          phone_number_text?: string | null;
          logo_path?: string | null;
          banner_path?: string | null;
          services?: any;
          portfolio?: any;
          email?: string | null;
          website?: string | null;
          social_media?: any;
          last_edited?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          public_id?: string;
          business_name?: string;
          business_type?: string | null;
          service_area?: string | null;
          bio?: string | null;
          phone_number_call?: string | null;
          phone_number_text?: string | null;
          logo_path?: string | null;
          banner_path?: string | null;
          services?: any;
          portfolio?: any;
          email?: string | null;
          website?: string | null;
          social_media?: any;
          last_edited?: string;
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
          is_active: boolean;
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
          is_active?: boolean;
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
          is_active?: boolean;
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
    };
  };
};
