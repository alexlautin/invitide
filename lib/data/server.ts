import { createClient } from '@supabase/supabase-js';

export interface EventMeta {
  id: string;
  name: string;
  date: string;
  location: string;
}

// Share-link metadata lookup. Returns null if the event is missing or Supabase isn't configured.
export async function fetchEventForMetadata(id: string): Promise<EventMeta | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Demo events only exist in the browser.
  if (!url || !key || id.startsWith('demo-')) return null;

  const { data, error } = await createClient(url, key)
    .from('events')
    .select('id, name, date, location')
    .eq('id', id)
    .single();
  return error || !data ? null : (data as EventMeta);
}
