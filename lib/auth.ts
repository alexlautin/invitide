// lib/auth.ts
import { getSupabase } from './supabaseClient';

export async function signUpWithEmail(email: string, password: string) {
  return await getSupabase().auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return await getSupabase().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await getSupabase().auth.signOut();
}
