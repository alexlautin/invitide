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

      // Update the RSVP record using eventName for matching
      const { data, error } = await supabase
        .from('rsvps')
        .update({ signed_in: true })
        .match({ user_id: guestId, event_name: eventName });

      if (error || !data) {
        setError('Failed to check in guest. Please try again.');
      } else {
        setMessage('Guest has been successfully checked in!');
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
