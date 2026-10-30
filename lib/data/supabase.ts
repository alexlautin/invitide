import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { DataSource, EventRecord, Profile, Attendee } from './types';

const toAttendee = (p: { id: string; display_name: string }): Attendee => ({
  id: p.id,
  user_id: p.id,
  display_name: p.display_name,
});

async function retryFetch(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error('API request failed after retries');
}

const NOT_CONFIGURED = { error: 'The backend is not configured. Try the demo instead.' };

export const supabaseSource: DataSource = {
  async getCurrentUser() {
    if (!isSupabaseConfigured()) return null;
    const { data: { session }, error } = await getSupabase().auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    return session?.user ?? null;
  },

  async signOut() {
    await getSupabase().auth.signOut();
  },

  async signIn(email, password) {
    if (!isSupabaseConfigured()) return NOT_CONFIGURED;
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data?.user?.id) {
      const userId = data.user.id;
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        const displayName = data.user.user_metadata?.display_name || 'Anonymous';
        const { error: profileError } = await supabase.from('profiles').insert([
          { id: userId, display_name: displayName },
        ]);
        if (profileError) {
          console.error('Failed to create profile:', profileError.message);
        }
      }
    }
    return {};
  },

  async signUp(email, password, displayName) {
    if (!isSupabaseConfigured()) return NOT_CONFIGURED;
    const supabase = getSupabase();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (signUpError) return { error: signUpError.message };

    let userId = signUpData.user?.id;
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id;
    }
    if (!userId) return { error: 'Signup succeeded, but could not retrieve user ID.' };

    const { error: profileError } = await supabase.from('profiles').insert([
      { id: userId, display_name: displayName },
    ]);
    if (profileError) {
      console.error('Profile insert error:', profileError.message);
      return { error: 'Signup succeeded, but profile creation failed.' };
    }
    return {};
  },

  async signInWithGitHub() {
    if (!isSupabaseConfigured()) return NOT_CONFIGURED;
    const { error } = await getSupabase().auth.signInWithOAuth({ provider: 'github' });
    return error ? { error: error.message } : {};
  },

  async getProfile(userId) {
    const { data } = await getSupabase().from('profiles').select('*').eq('id', userId).single();
    return (data as Profile | null) ?? null;
  },

  async updateProfile(userId, displayName) {
    const { error } = await getSupabase()
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);
    return error ? { error: error.message } : {};
  },

  async getMyEvents(userId) {
    const supabase = getSupabase();
    const [{ data: hosting }, { data: attendingIds }] = await Promise.all([
      supabase.from('events').select('*, profiles(display_name)').eq('user_id', userId),
      supabase.from('event_attendees').select('event_id').eq('user_id', userId),
    ]);

    const attendingEventIds = attendingIds?.map((a) => a.event_id) || [];
    const { data: attending } = await supabase
      .from('events')
      .select('*, profiles(display_name)')
      .in('id', attendingEventIds);

    return {
      hosting: (hosting as EventRecord[] | null) || [],
      attending: (attending as EventRecord[] | null) || [],
    };
  },

  async getEvent(id) {
    const { data, error } = await getSupabase()
      .from('events')
      .select('*, profiles(display_name)')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching event details,', error);
      return null;
    }
    return data as EventRecord;
  },

  async getLatestEvent() {
    const { data, error } = await getSupabase()
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return !error && data ? (data as EventRecord) : null;
  },

  async createEvent(input) {
    const { data, error } = await getSupabase().from('events').insert([input]).select().single();
    if (error) return { error: error.message };
    return { event: data as EventRecord };
  },

  async deleteEvent(eventId, userId) {
    const supabase = getSupabase();
    const { error: attendeesError } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId);
    if (attendeesError) return { error: attendeesError.message };

    const { error: eventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId);
    return eventError ? { error: eventError.message } : {};
  },

  async ensureMeetingLink(event) {
    if (event.meeting_link) return { link: event.meeting_link };

    const jitsiMeetingLink = `https://meet.jit.si/event-room-${Date.now()}`;
    const { data, error } = await getSupabase()
      .from('events')
      .update({ meeting_link: jitsiMeetingLink })
      .eq('id', event.id)
      .select('meeting_link');
    if (error) return { error };
    return { link: data && data.length > 0 ? data[0].meeting_link : null };
  },

  async isRsvped(eventId, userId) {
    const { data } = await getSupabase()
      .from('event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    return !!data;
  },

  async setRsvp(eventId, userId, going) {
    const supabase = getSupabase();
    if (going) {
      const { error } = await supabase
        .from('event_attendees')
        .insert([{ event_id: eventId, user_id: userId }]);
      return error ? { error: error.message } : {};
    }
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    return error ? { error: error.message } : {};
  },

  async getRoster(eventId) {
    const supabase = getSupabase();
    const { data: attendeesRaw, error: attendeesError } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId);
    if (attendeesError) throw attendeesError;

    const userIds = attendeesRaw?.map((a) => a.user_id) ?? [];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds as string[]);
    if (profilesError) throw profilesError;

    // The app has a single event_attendees table, so "attendees" and "joined" are the same rows.
    const people = (profilesData ?? []).map(toAttendee);
    return { attendees: people, joined: people };
  },

  async checkInAttendee(eventId, code) {
    let userId = code;
    if (code.includes('{') && code.includes('}')) {
      try {
        userId = JSON.parse(code).userId || code;
      } catch (e) {
        console.error('Failed to parse QR JSON:', e);
      }
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('event_attendees')
      .upsert({ event_id: eventId, user_id: userId }, { onConflict: 'event_id,user_id' });
    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .single();
    if (!profile) return { error: 'User profile not found.' };
    return { profile };
  },

  async generateDescription(event) {
    const prompt = `Write a short and engaging description for the event named '${event.name}' happening at ${event.location} on ${new Date(event.date).toLocaleDateString()} It should be one sentence. Only give one response and one option. You are a moderated chat bot, so no explicit phrases or anything you deem inappropriate will be tolerated. The title may not include any such thing that you do not think is appropriate. You do not have to generate anything that goes against your filter.`;
    const response = await retryFetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    return data?.text || 'No description generated.';
  },

  async saveDescription(eventId, description) {
    const { error } = await getSupabase()
      .from('events')
      .update({ description })
      .eq('id', eventId);
    if (error) {
      console.error('Error updating event description:', error);
      return { error: error.message };
    }
    return {};
  },

  async sendInvite(to, event, link) {
    try {
      const res = await fetch('/api/send-event-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          event: { name: event.name, date: event.date, location: event.location, link },
        }),
      });
      if (res.ok) return {};
      const data = await res.json();
      return { error: data.error || 'Failed to send email' };
    } catch {
      return { error: 'Failed to send email' };
    }
  },
};
