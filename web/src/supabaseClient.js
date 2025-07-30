// web/src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your environment"
  );
}

// createClient returns the single supabase instance
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// **Default export** so `import supabase from './supabaseClient'` works
export default supabase;
