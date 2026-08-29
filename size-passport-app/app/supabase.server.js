import { createClient } from '@supabase/supabase-js';

// We ensure the supabase client is a singleton during development
// so we don't create multiple connections when Remix rebuilds.
let supabase;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Anon/Service Key must be set in environment variables');
}

if (process.env.NODE_ENV === 'production') {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  if (!global.__supabase) {
    global.__supabase = createClient(supabaseUrl, supabaseKey);
  }
  supabase = global.__supabase;
}

export { supabase };
