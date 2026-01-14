// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Só tenta criar cliente se estiver no browser ou tiver as vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Não lança erro no server — só no client se faltar algo
export const supabase =
  typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;