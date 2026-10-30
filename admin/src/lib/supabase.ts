import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url =
  import.meta.env.VITE_SUPABASE_URL || 'https://cpnvqdodmiacrvldykli.supabase.co';
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_y2mTbCDgd2fLoqQuWYn-2w_9sd6z22p';

export const supabase: SupabaseClient<Database> | null =
  url && anonKey
    ? createClient<Database>(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
