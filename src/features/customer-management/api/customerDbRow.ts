import type { Database } from '@/libs/supabase/client';

export type CustomerDbRow = Database['public']['Tables']['customers']['Row'];
