export interface AppUser {
  id: string;
  email?: string;
}

export interface Profile {
  id: string;
  display_name: string;
  email?: string;
}

export interface EventRecord {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  user_id: string;
  meeting_link?: string | null;
  created_at?: string;
  profiles?: { display_name: string } | null;
  /** Only set by the demo backend: false when the description was written by hand. */
  ai_generated?: boolean;
  /** Only set by the demo backend. */
  attendee_count?: number;
}

export type RsvpStatus = 'going' | 'maybe' | 'declined';

export interface Attendee {
  id: string;
  user_id: string;
  display_name: string;
  /** Demo backend only. */
  rsvp_status?: RsvpStatus;
  checked_in?: boolean;
  code?: string;
}

export interface Roster {
  attendees: Attendee[];
  joined: Attendee[];
}

export interface Result {
  error?: string;
}

export interface CheckInResult extends Result {
  profile?: Profile;
  alreadyCheckedIn?: boolean;
}

export interface NewEvent {
  name: string;
  date: string;
  location: string;
  user_id: string;
}

/** Everything the UI needs from a backend. Implemented by supabase.ts and demo.ts. */
export interface DataSource {
  getCurrentUser(): Promise<AppUser | null>;
  signOut(): Promise<void>;
  signIn(email: string, password: string): Promise<Result>;
  signUp(email: string, password: string, displayName: string): Promise<Result>;
  signInWithGitHub(): Promise<Result>;

  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, displayName: string): Promise<Result>;

  getMyEvents(userId: string): Promise<{ hosting: EventRecord[]; attending: EventRecord[] }>;
  getEvent(id: string): Promise<EventRecord | null>;
  getLatestEvent(): Promise<EventRecord | null>;
  createEvent(input: NewEvent): Promise<Result & { event?: EventRecord }>;
  deleteEvent(eventId: string, userId: string): Promise<Result>;
  ensureMeetingLink(event: EventRecord): Promise<{ link?: string | null; error?: unknown }>;

  isRsvped(eventId: string, userId: string): Promise<boolean>;
  setRsvp(eventId: string, userId: string, going: boolean): Promise<Result>;
  getRoster(eventId: string): Promise<Roster>;
  checkInAttendee(eventId: string, code: string): Promise<CheckInResult>;

  generateDescription(event: EventRecord): Promise<string>;
  saveDescription(eventId: string, description: string): Promise<Result>;
  sendInvite(to: string, event: EventRecord): Promise<Result>;
}
