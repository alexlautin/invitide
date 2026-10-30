import { createClient } from '@supabase/supabase-js';

export interface EventMeta {
  id: string;
  name: string;
  date: string;
  location: string;
}

/**
 * Server-side lookup used for share-link metadata only. Returns null when the event
 * can't be found or Supabase isn't configured, so the app still renders without env vars.
 */
export async function fetchEventForMetadata(id: string): Promise<EventMeta | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Demo events live only in the visitor's browser, so there is nothing to look up.
  if (!url || !key || id.startsWith('demo-')) return null;

  const { data, error } = await createClient(url, key)
    .from('events')
    .select('id, name, date, location')
    .eq('id', id)
    .single();
  return error || !data ? null : (data as EventMeta);
}
