import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// NOTE:
// The auto-generated client (src/integrations/supabase/client.ts) reads from import.meta.env.
// In some preview/build environments those variables can be missing, causing a hard crash:
// "supabaseUrl is required".
//
// This wrapper provides a safe, public fallback so the app never blank-screens.

const FALLBACK_SUPABASE_URL = "https://dzzeaesctendsggfdxra.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6emVhZXNjdGVuZHNnZ2ZkeHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjQxNDcsImV4cCI6MjA4MjI0MDE0N30.PwC5xpu-FNZfnSmNUAHhpuBG1UGZWR0emXo6MQrpEoM";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
