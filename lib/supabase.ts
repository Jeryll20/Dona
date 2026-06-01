// Supabase client — configure with project URL and anon key from environment
// See: https://supabase.com/docs/guides/getting-started/quickstarts/expo

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Dona] Supabase env vars not set. Auth and data sync will be unavailable.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
