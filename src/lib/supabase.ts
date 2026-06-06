import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

// If it's just the project ID (no dots), expand it
if (supabaseUrl && !supabaseUrl.includes(".")) {
  supabaseUrl = `${supabaseUrl}.supabase.co`;
}

// Ensure URL has protocol
if (supabaseUrl && !supabaseUrl.startsWith("http")) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Remove trailing slash
if (supabaseUrl && supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
