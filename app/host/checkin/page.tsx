'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function HostCheckin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guestId = searchParams.get('guestId');
  const eventName = searchParams.get('eventName'); // Using eventName instead of eventId

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkInGuest() {
      // Ensure the host is logged in:
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Redirect to login if not authenticated:
        router.push('/login');
        return;
      }

      if (!guestId || !eventName) {
        setError('Missing guestId or eventName in the URL.');
        setLoading(false);
        return;
      }

      console.log('Supabase client initialized:', supabase);

      // Update the RSVP record using eventName for matching
      try {
        const { data, error } = await supabase
          .from('rsvps')
          .select('*')
          .eq('user_id', guestId)
          .eq('event_name', eventName);

        console.log('Supabase response:', { data, error });

        if (error) {
          setError('An error occurred during check-in. Please try again.');
        } else if (!data || data.length === 0) {
          setError('No RSVP found for this guest and event. Please check the event name.');
        } else {
          setMessage('Guest record found (select query succeeded).');
        }
      } catch (err) {
        console.error('Hard error during Supabase select:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
          raw: err,
        });
        setError('Unexpected failure. Could not contact database.');
      }
      setLoading(false);
    }

    checkInGuest();
  }, [guestId, eventName, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Processing check-in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {error ? (
        <p className="text-red-500 text-xl mb-4">{error}</p>
      ) : (
        <p className="text-green-500 text-xl mb-4">{message}</p>
      )}
      <button
        onClick={() => router.push('/host/events')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Back to Events
      </button>
    </div>
  );
}
