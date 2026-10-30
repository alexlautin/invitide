// All backend access (Supabase, Gemini, Resend) goes through here.
import { isDemo } from '@/lib/demo/flag';
import { demoSource } from './demo';
import { supabaseSource } from './supabase';
import type { DataSource } from './types';

export * from './types';

// Demo mode (set via /demo) swaps in the in-memory backend.
const source = (): DataSource => (isDemo() ? demoSource : supabaseSource);

export const getCurrentUser: DataSource['getCurrentUser'] = () => source().getCurrentUser();
export const signOut: DataSource['signOut'] = () => source().signOut();
export const signIn: DataSource['signIn'] = (...a) => source().signIn(...a);
export const signUp: DataSource['signUp'] = (...a) => source().signUp(...a);
export const signInWithGitHub: DataSource['signInWithGitHub'] = () => source().signInWithGitHub();
export const getProfile: DataSource['getProfile'] = (...a) => source().getProfile(...a);
export const updateProfile: DataSource['updateProfile'] = (...a) => source().updateProfile(...a);
export const getMyEvents: DataSource['getMyEvents'] = (...a) => source().getMyEvents(...a);
export const getEvent: DataSource['getEvent'] = (...a) => source().getEvent(...a);
export const getLatestEvent: DataSource['getLatestEvent'] = () => source().getLatestEvent();
export const createEvent: DataSource['createEvent'] = (...a) => source().createEvent(...a);
export const deleteEvent: DataSource['deleteEvent'] = (...a) => source().deleteEvent(...a);
export const ensureMeetingLink: DataSource['ensureMeetingLink'] = (...a) => source().ensureMeetingLink(...a);
export const isRsvped: DataSource['isRsvped'] = (...a) => source().isRsvped(...a);
export const setRsvp: DataSource['setRsvp'] = (...a) => source().setRsvp(...a);
export const getRoster: DataSource['getRoster'] = (...a) => source().getRoster(...a);
export const checkInAttendee: DataSource['checkInAttendee'] = (...a) => source().checkInAttendee(...a);
export const generateDescription: DataSource['generateDescription'] = (...a) => source().generateDescription(...a);
export const saveDescription: DataSource['saveDescription'] = (...a) => source().saveDescription(...a);
export const sendInvite: DataSource['sendInvite'] = (...a) => source().sendInvite(...a);
