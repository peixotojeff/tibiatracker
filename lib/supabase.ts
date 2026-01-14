// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Só lança erro se estiver no browser (cliente)
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables');
  }
  // No server, retorna um objeto falso (nunca usado)
  const dummyClient = {
    from: () => dummyClient,
    select: () => dummyClient,
    eq: () => dummyClient,
    insert: () => dummyClient,
    auth: { signInWithPassword: () => ({}), signUp: () => ({}) },
  };
  // @ts-ignore
  export const supabase = dummyClient;
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
}