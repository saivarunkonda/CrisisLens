// Supabase Auth provider for NextAuth.js
// The `@auth/supabase-adapter` package is optional; load it at runtime if available.
/* eslint-disable @typescript-eslint/no-var-requires */
declare const require: any;
let SupabaseAdapterAny: any = undefined;
try {
  SupabaseAdapterAny = require('@auth/supabase-adapter').SupabaseAdapter;
} catch (e) {
  // adapter not installed; skip
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const supabaseAdapter = SupabaseAdapterAny
  ? SupabaseAdapterAny({ url: supabaseUrl, secret: supabaseKey })
  : undefined;
