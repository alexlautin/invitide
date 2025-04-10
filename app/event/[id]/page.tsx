'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400'],
});

const vt323 = VT323({
  subsets: ['latin'],
  variable: '--font-vt323',
  weight: ['400'],
});

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  user_id: string;
  profiles?: {
    display_name: string;
  } | null;
}

export default function EventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, profiles(display_name)')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id]);

  if (loading) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <div className="text-2xl">Loading event details...</div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <div className="text-2xl text-red-500">{error || 'Event not found'}</div>
      </main>
    );
  }

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
      <div className="absolute top-4 left-4">
        <Link href="/find-events" className="text-[#E4DDC4] hover:underline text-2xl">
          ← Back to Events
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl w-full px-4">
        <div className="bg-[#1F1F1F] border-[5px] border-[#E4DDC4] rounded-lg p-8 shadow-[4px_4px_0px_#000]">
          {event.image_url && (
            <div className="mb-6">
              <img
                src={event.image_url}
                alt={event.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-vt323)' }}>
            {event.name}
          </h1>

          <div className="mb-6">
            <p className="text-lg mb-4">{event.description}</p>
            <div className="flex flex-col gap-2">
              <p className="text-[#E4DDC4]">
                <span className="font-semibold">Date:</span> {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-[#E4DDC4]">
                <span className="font-semibold">Location:</span> {event.location}
              </p>
              <p className="text-[#E4DDC4]">
                <span className="font-semibold">Created by:</span> @{event.profiles?.display_name ?? 'anonymous'}
              </p>
            </div>
          </div>

          <button
              onClick={() => {
                const eventUrl = `${window.location.origin}/event/${event.id}`;
                navigator.clipboard.writeText(eventUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000); // hide after 3s
                });
              }}
            className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
          >
            Copy Event Link
          </button>
        </div>
        </div>
      </div>
      {copied && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] px-6 py-3 rounded-lg shadow-[4px_4px_0px_#000] text-xl font-mono animate-slide-in-out z-50">
          Event link copied to clipboard!
        </div>
      )}
    </main>
  );
}