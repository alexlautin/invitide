/**
 * In-memory backend used when demo mode is on. Makes no network requests.
 * State lives in module scope: it survives client-side navigation and resets on a full reload.
 */
import { disableDemo } from '@/lib/demo/flag';
import { descriptionFor } from './demoCopy';
import type { Attendee, CheckInResult, DataSource, EventRecord, Profile, RsvpStatus } from './types';

const HOST_ID = 'demo-host';
const AI_DELAY_MS = 1000;

const PEOPLE: { id: string; name: string }[] = [
  ['demo-host', 'Demo Host'],
  ['demo-u-organizer-a', 'Example Organizer A'],
  ['demo-u-organizer-b', 'Example Organizer B'],
  ['demo-u-g01', 'Example Guest 01'],
  ['demo-u-g02', 'Example Guest 02'],
  ['demo-u-g03', 'Example Guest 03'],
  ['demo-u-g04', 'Example Guest 04'],
  ['demo-u-g05', 'Example Guest 05'],
  ['demo-u-g06', 'Example Guest 06'],
  ['demo-u-g07', 'Example Guest 07'],
  ['demo-u-g08', 'Example Guest 08'],
  ['demo-u-g09', 'Example Guest 09'],
  ['demo-u-g10', 'Example Guest 10'],
  ['demo-u-g11', 'Example Guest 11'],
  ['demo-u-g12', 'Example Guest 12'],
  ['demo-u-g13', 'Example Guest 13'],
  ['demo-u-g14', 'Example Guest 14'],
  ['demo-u-g15', 'Example Guest 15'],
  ['demo-u-g16', 'Example Guest 16'],
  ['demo-u-g17', 'Example Guest 17'],
  ['demo-u-g18', 'Example Guest 18'],
  ['demo-u-g19', 'Example Guest 19'],
  ['demo-u-g20', 'Example Guest 20'],
  ['demo-u-g21', 'Example Guest 21'],
].map(([id, name]) => ({ id, name }));

// Each person has a stable check-in code, like the one encoded in their profile QR.
const codeOf = (index: number) => `INV-${1000 + index * 113}`;
const personById = (id: string) => PEOPLE.findIndex((p) => p.id === id);

interface RosterEntry {
  userId: string;
  status: RsvpStatus;
  checkedIn: boolean;
}

interface State {
  events: EventRecord[];
  rosters: Record<string, RosterEntry[]>;
  aiRuns: Record<string, number>;
}

let state: State | null = null;

const at = (daysFromNow: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// [person index, RSVP status, checked in]
type Row = [number, RsvpStatus, boolean];
const G = 'going' as const;
const M = 'maybe' as const;
const D = 'declined' as const;

function seed(): State {
  const ev = (
    id: string,
    name: string,
    description: string,
    date: string,
    location: string,
    user_id: string,
    extra: Partial<EventRecord> = {}
  ): EventRecord => ({
    id,
    name,
    description,
    date,
    location,
    image_url: '',
    user_id,
    meeting_link: null,
    created_at: at(-40, 12),
    ai_generated: false,
    ...extra,
  });

  const events: EventRecord[] = [
    ev(
      'demo-evt-rooftop',
      'Harbor Lights Rooftop Social',
      'Sunset cocktails, a good playlist and the whole skyline to ourselves. Dress casually, bring a friend, and stay for the lights coming on over the bay.',
      at(6, 19),
      'Downtown Rooftop Lounge, San Francisco, CA',
      HOST_ID
    ),
    ev(
      'demo-evt-hackers',
      'Bay Area Indie Hackers Meetup',
      'Lightning demos, honest feedback and pizza for people building small products on their own terms. Join in person or over video.',
      at(13, 18, 30),
      'Community Coworking Space, San Francisco, CA (and online)',
      HOST_ID,
      { meeting_link: 'https://meet.jit.si/invitide-indie-hackers-demo' }
    ),
    ev(
      'demo-evt-sourdough',
      'Sunday Sourdough Workshop',
      'A hands-on morning of shaping, scoring and baking your first proper loaf. Everyone goes home with warm bread and a jar of starter.',
      at(-9, 10),
      'Neighborhood Bakery, Oakland, CA',
      HOST_ID
    ),
    ev(
      'demo-evt-blockparty',
      'Neighborhood Block Party',
      'We closed the street for an afternoon of grilling, lawn games, a kids’ bike parade and live music from a local band.',
      at(-32, 14),
      'Residential Street, Berkeley, CA',
      HOST_ID
    ),
    ev(
      'demo-evt-trailrun',
      'Lakeside Trail Run & Brunch',
      'An easy 5K loop around the lake at sunrise, followed by a long communal brunch. All paces welcome.',
      at(3, 8),
      'Lakeside Regional Park, Castro Valley, CA',
      'demo-u-organizer-a',
      { created_at: at(-12, 9) }
    ),
    ev(
      'demo-evt-openmic',
      'Open Mic Night',
      'Sign up on the chalkboard and take the stage, or settle in with a drink and cheer on your neighbors. Music, poetry and comedy all welcome.',
      at(10, 20),
      'Corner Cafe & Bar, Oakland, CA',
      'demo-u-organizer-b',
      { created_at: at(-6, 15) }
    ),
  ];

  const roster = (rows: Row[]): RosterEntry[] =>
    rows.map(([i, status, checkedIn]) => ({ userId: PEOPLE[i].id, status, checkedIn }));

  return {
    events,
    aiRuns: {},
    rosters: {
      'demo-evt-rooftop': roster([
        [1, G, false], [3, G, false], [4, G, false], [5, G, false], [6, G, false], [7, G, false],
        [8, G, false], [9, G, false], [10, G, false], [11, M, false], [12, M, false], [13, D, false],
      ]),
      'demo-evt-hackers': roster([
        [2, G, false], [3, G, false], [9, G, false], [14, G, false], [15, G, false],
        [16, G, false], [17, M, false], [18, G, false], [19, M, false], [20, D, false],
      ]),
      'demo-evt-sourdough': roster([
        [4, G, true], [6, G, true], [8, G, true], [10, G, true], [12, G, true], [21, G, true],
        [22, G, false], [23, M, false],
      ]),
      'demo-evt-blockparty': roster([
        [1, G, true], [2, G, true], [3, G, true], [5, G, true], [7, G, true], [9, G, true], [11, G, true],
        [13, G, true], [14, G, true], [16, G, true], [18, G, true], [19, G, false], [20, G, true], [22, M, false],
      ]),
      'demo-evt-trailrun': roster([
        [0, G, false], [3, G, false], [5, G, false], [8, G, false], [15, G, false], [17, M, false], [21, G, false],
      ]),
      'demo-evt-openmic': roster([
        [0, M, false], [1, G, false], [4, G, false], [6, G, false], [10, G, false], [12, G, false], [16, M, false], [19, G, false],
        [23, G, false],
      ]),
    },
  };
}

const getState = (): State => (state ??= seed());
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hostName = (userId: string) => PEOPLE[personById(userId)]?.name ?? 'anonymous';

function present(event: EventRecord): EventRecord {
  const roster = getState().rosters[event.id] ?? [];
  return {
    ...event,
    profiles: { display_name: hostName(event.user_id) },
    attendee_count: roster.filter((r) => r.status === 'going').length,
  };
}

const toAttendee = (entry: RosterEntry): Attendee => {
  const i = personById(entry.userId);
  return {
    id: entry.userId,
    user_id: entry.userId,
    display_name: PEOPLE[i]?.name ?? 'Unknown',
    rsvp_status: entry.status,
    checked_in: entry.checkedIn,
    code: i >= 0 ? codeOf(i) : undefined,
  };
};

const profileOf = (id: string): Profile | null => {
  const i = personById(id);
  if (i < 0) return null;
  return { id, display_name: PEOPLE[i].name, email: id === HOST_ID ? 'demo.host@example.com' : undefined };
};

// Overrides when the demo host edits their own profile.
let hostDisplayName: string | null = null;

export const demoSource: DataSource = {
  async getCurrentUser() {
    return { id: HOST_ID, email: 'demo.host@example.com' };
  },

  async signOut() {
    state = null;
    hostDisplayName = null;
    disableDemo();
  },

  async signIn() {
    return { error: 'Sign-in is disabled in demo mode.' };
  },
  async signUp() {
    return { error: 'Sign-up is disabled in demo mode.' };
  },
  async signInWithGitHub() {
    return { error: 'GitHub sign-in is disabled in demo mode.' };
  },

  async getProfile(userId) {
    const profile = profileOf(userId);
    if (profile && userId === HOST_ID && hostDisplayName) profile.display_name = hostDisplayName;
    return profile;
  },

  async updateProfile(userId, displayName) {
    if (userId === HOST_ID) hostDisplayName = displayName;
    return {};
  },

  async getMyEvents(userId) {
    const s = getState();
    const hosting = s.events.filter((e) => e.user_id === userId);
    const attending = s.events.filter(
      (e) => e.user_id !== userId && s.rosters[e.id]?.some((r) => r.userId === userId && r.status !== 'declined')
    );
    return { hosting: hosting.map(present), attending: attending.map(present) };
  },

  async getEvent(id) {
    const event = getState().events.find((e) => e.id === id);
    return event ? present(event) : null;
  },

  async getLatestEvent() {
    const sorted = [...getState().events].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    return sorted[0] ? present(sorted[0]) : null;
  },

  async createEvent(input) {
    const s = getState();
    const event: EventRecord = {
      id: `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      date: input.date,
      location: input.location,
      user_id: input.user_id,
      description: '',
      image_url: '',
      meeting_link: null,
      created_at: new Date().toISOString(),
      ai_generated: false,
    };
    s.events.push(event);
    s.rosters[event.id] = [];
    return { event: present(event) };
  },

  async deleteEvent(eventId) {
    const s = getState();
    s.events = s.events.filter((e) => e.id !== eventId);
    delete s.rosters[eventId];
    return {};
  },

  async ensureMeetingLink(event) {
    return { link: event.meeting_link ?? null };
  },

  async isRsvped(eventId, userId) {
    return !!getState().rosters[eventId]?.some((r) => r.userId === userId && r.status === 'going');
  },

  async setRsvp(eventId, userId, going) {
    const s = getState();
    const roster = (s.rosters[eventId] ??= []);
    const existing = roster.find((r) => r.userId === userId);
    if (going) {
      if (existing) existing.status = 'going';
      else roster.push({ userId, status: 'going', checkedIn: false });
    } else {
      s.rosters[eventId] = roster.filter((r) => r.userId !== userId);
    }
    return {};
  },

  async getRoster(eventId) {
    const attendees = (getState().rosters[eventId] ?? []).map(toAttendee);
    return { attendees, joined: attendees.filter((a) => a.checked_in) };
  },

  async checkInAttendee(eventId, rawCode): Promise<CheckInResult> {
    // Accept a bare code, a bare user id, or the {"userId": ...} JSON a profile QR encodes.
    let code = rawCode.trim();
    if (code.startsWith('{')) {
      try {
        code = String(JSON.parse(code).userId ?? code);
      } catch {
        // fall through with the raw text
      }
    }

    const index = PEOPLE.findIndex(
      (p, i) => p.id === code || codeOf(i).toLowerCase() === code.toLowerCase()
    );
    if (index < 0) return { error: 'User profile not found.' };

    const person = PEOPLE[index];
    const roster = (getState().rosters[eventId] ??= []);
    let entry = roster.find((r) => r.userId === person.id);
    const alreadyCheckedIn = !!entry?.checkedIn;
    if (!entry) {
      entry = { userId: person.id, status: 'going', checkedIn: false };
      roster.push(entry);
    }
    entry.checkedIn = true;
    return { profile: { id: person.id, display_name: person.name }, alreadyCheckedIn };
  },

  async generateDescription(event) {
    await wait(AI_DELAY_MS);
    const s = getState();
    const nth = s.aiRuns[event.id] ?? 0;
    s.aiRuns[event.id] = nth + 1;
    return descriptionFor(event.id, event.name, event.location, nth);
  },

  async saveDescription(eventId, description) {
    const event = getState().events.find((e) => e.id === eventId);
    if (event) {
      event.description = description;
      event.ai_generated = true;
    }
    return {};
  },

  async sendInvite() {
    return { error: 'Sending email is disabled in demo mode.' };
  },
};
