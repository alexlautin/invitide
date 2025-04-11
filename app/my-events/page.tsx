'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

export default function MyEventsPage() {
  const router = useRouter();
  const [hostedEvents, setHostedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user?.id) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      const [{ data: hosting }, { data: attendingIds }] = await Promise.all([
        supabase
          .from('events')
          .select('*, profiles(display_name)')
          .eq('user_id', userId),
        supabase
          .from('event_attendees')
          .select('event_id')
          .eq('user_id', userId),
      ]);

      const attendingEventIds = attendingIds?.map(a => a.event_id) || [];

      const { data: attendingEventsData } = await supabase
        .from('events')
        .select('*, profiles(display_name)')
        .in('id', attendingEventIds);

      setHostedEvents(hosting || []);
      setAttendingEvents(attendingEventsData || []);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const renderEventCard = (event: Event) => (
    <div
      key={event.id}
      onClick={() => router.push(`/event/${event.id}`)}
      className="cursor-pointer bg-[#1F1F1F] border-[4px] border-[#E4DDC4] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[4px_4px_0px_#000] relative"
    >
      {/* Scan Line Effect for Card */}
      <div className="absolute inset-0 animate-scan" style={{
        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%)',
        backgroundSize: '100% 4px',
      }}></div>

      <div className="flex justify-between items-center px-4 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const eventUrl = `${window.location.origin}/event/${event.id}`;
            navigator.clipboard.writeText(eventUrl)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              });
          }}
          className="text-xs uppercase font-[var(--font-vt323)] text-[#1F1F1F] bg-[#E4DDC4] px-2 py-1 rounded hover:bg-[#ccc] transition"
          style={{ textShadow: '2px 2px 0px #000' }}
        >
          Copy Link
        </button>
        <span className="text-sm text-[#E4DDC4] font-[var(--font-vt323)]" style={{ textShadow: '2px 2px 0px #000' }}>
          @{event.profiles?.display_name ?? 'anonymous'}
        </span>
      </div>
      {event.image_url && (
        <div className="relative">
          <Image
            src={event.image_url}
            alt={event.name}
            width={500}
            height={200}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.1)]" style={{
            backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
            backgroundSize: '100% 4px',
          }}></div>
        </div>
      )}
      <div className="p-6">
        <h2 className="text-2xl font-[var(--font-vt323)] mb-2 uppercase" style={{ textShadow: '2px 2px 0px #000' }}>
          {event.name}
        </h2>
        <p className="text-[#E4DDC4] mb-4 font-[var(--font-vt323)]" style={{ textShadow: '2px 2px 0px #000' }}>{event.description}</p>
        <div className="flex justify-between text-sm text-[#E4DDC4] font-[var(--font-vt323)]" style={{ textShadow: '2px 2px 0px #000' }}>
          <span>
            {new Date(event.date).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          <span>{event.location}</span>
        </div>
      </div>
    </div>
  );

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} relative min-h-screen text-[#E4DDC4] p-8 overflow-hidden`}>
      {/* Scan Line Effect */}
      <div className="fixed inset-0 animate-scan" style={{
        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%)',
        backgroundSize: '100% 4px',
      }}></div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-[var(--font-vt323)] tracking-wider uppercase" style={{ textShadow: '4px 4px 0px #000' }}>My Events</h1>
        <Link
          href="/"
          className="border-[4px] text-[18px] font-[var(--font-vt323)] border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
          style={{ textShadow: '2px 2px 0px #000' }}
        >
          Back to Home
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search events..."
        className="w-full mb-8 p-4 rounded-lg bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] font-[var(--font-vt323)]"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ textShadow: '2px 2px 0px #000' }}
      />

      {loading ? (
        <p className="text-center font-[var(--font-vt323)]" style={{ textShadow: '2px 2px 0px #000' }}>Loading events...</p>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="text-2xl mb-4 font-[var(--font-vt323)]" style={{ textShadow: '2px 2px 0px #000' }}>Hosting</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostedEvents.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderEventCard)}
            </div>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-[var(--font-vt323)]" style={{ textShadow: '2px 2px 0px #000' }}>Attending</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attendingEvents.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderEventCard)}
            </div>
          </section>
        </>
      )}

      {copied && (
        <div className="fixed bottom-4 left-1/2 w-[90%] sm:w-auto max-w-xs sm:max-w-sm transform -translate-x-1/2 bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] px-4 py-2 rounded-lg shadow-[4px_4px_0px_#000] text-base sm:text-xl font-[var(--font-vt323)] animate-slide-in-out z-50 text-center" style={{ textShadow: '2px 2px 0px #000' }}>
          Event link copied to clipboard!
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>
    </main>
  );
}