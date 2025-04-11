'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';

const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', weight: ['400'] });
const vt323 = VT323({ subsets: ['latin'], variable: '--font-vt323', weight: ['400'] });

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  user_id: string;
  profiles?: { display_name: string } | null;
}

export default function EventPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;
      setUser(currentUser);

      const { data: eventData } = await supabase
        .from('events')
        .select('*, profiles(display_name)')
        .eq('id', id)
        .single();

      setEvent(eventData ?? null);

      if (currentUser) {
        const { data: attendee } = await supabase
          .from('event_attendees')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', currentUser.id)
          .single();

        setIsAttending(!!attendee);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleToggleRSVP = async () => {
    if (!user || !event) return;

    if (isAttending) {
      await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);
      setIsAttending(false);
    } else {
      await supabase
        .from('event_attendees')
        .insert({ event_id: event.id, user_id: user.id });
      setIsAttending(true);
    }
  };

  if (loading || !event) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <div className="text-2xl">Loading event details...</div>
      </main>
    );
  }

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
      <Link href="/my-events" className="absolute top-4 left-4 text-[#E4DDC4] hover:underline text-2xl">← Back to Events</Link>

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl w-full px-4">
          <div className="bg-[#1F1F1F] border-[5px] border-[#E4DDC4] rounded-lg p-8 shadow-[4px_4px_0px_#000]">
            {event.image_url?.trim() && (
              <Image src={event.image_url} alt={event.name} width={800} height={400} className="w-full h-64 object-cover rounded-lg" />
            )}

            <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-vt323)' }}>{event.name}</h1>

            <div className="mb-6">
              <p className="text-lg mb-4">{event.description}</p>
              <p><strong>Date & Time:</strong> {new Date(event.date).toLocaleString()}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Created by:</strong> @{event.profiles?.display_name ?? 'anonymous'}</p>
            </div>

            {user && user.id !== event.user_id && (
              <button
                onClick={handleToggleRSVP}
                className={`w-full border-[4px] px-4 py-2 text-lg uppercase font-mono ${isAttending
                    ? 'bg-green-500 text-black border-green-500 hover:bg-green-400'
                    : 'bg-[#E4DDC4] text-[#1F1F1F] border-[#E4DDC4] hover:bg-[#d6d0b8]'
                  } transition duration-300`}
              >
                {isAttending ? 'Attending ✅' : 'RSVP to Attend'}
              </button>
            )}

            <button
              onClick={() => {
                const eventUrl = `${window.location.origin}/event/${event.id}`;
                navigator.clipboard.writeText(eventUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="mt-4 border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300 w-full"
            >
              Copy Event Link
            </button>
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] sm:w-auto max-w-xs sm:max-w-sm bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] px-4 py-2 rounded-lg shadow-[4px_4px_0px_#000] text-center text-base sm:text-xl font-mono animate-slide-in-out z-50">
          Event link copied to clipboard!
        </div>
      )}
    </main>
  );
}