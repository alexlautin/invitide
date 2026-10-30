import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Resolves the signed-in Supabase user from the request's bearer token, plus a client
// that queries as that user (so row-level security applies). Null when there is no
// valid session or Supabase isn't configured.
export async function getRequestUser(req: Request): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!url || !anonKey || !token) return null;

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export const unauthorized = () => Response.json({ error: 'Sign in to use this feature.' }, { status: 401 });
