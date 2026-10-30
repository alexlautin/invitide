'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getMyEvents, isSupabaseConfigured, type EventRecord } from '@/lib/data';
import DemoRequired from '@/components/DemoRequired';
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

export default function MyEventsPage() {
  const router = useRouter();
  const [hostedEvents, setHostedEvents] = useState<EventRecord[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<EventRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const user = await getCurrentUser();
      if (!user?.id) {
        setSignedOut(true);
        setLoading(false);
        return;
      }

      const { hosting, attending } = await getMyEvents(user.id);
      setHostedEvents(hosting);
      setAttendingEvents(attending);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const renderEventCard = (event: EventRecord) => (
    <div
      key={event.id}
      onClick={() => router.push(`/event/${event.id}`)}
      className="cursor-pointer bg-[#1F1F1F] border-[4px] border-[#E4DDC4] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[4px_4px_0px_#000]"
    >
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
          className="text-xs uppercase font-mono text-[#1F1F1F] bg-[#E4DDC4] px-2 py-1 rounded hover:bg-[#ccc] transition"
        >
          Copy Link
        </button>
        <span className="text-sm text-[#E4DDC4] font-mono">
          @{event.profiles?.display_name ?? 'anonymous'}
        </span>
      </div>
      {event.image_url && (
        <Image
          src={event.image_url}
          alt={event.name}
          width={500}
          height={200}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <h2 className="text-2xl font-mono mb-2 uppercase" style={{ fontFamily: 'var(--font-vt323)' }}>
          {event.name}
        </h2>
        <p className="text-[#E4DDC4] mb-4 font-mono">{event.description}</p>
        <div className="flex justify-between text-sm text-[#E4DDC4] font-mono">
          <span>
            {new Date(event.date).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          <span>{event.location}</span>
        </div>
        {event.attendee_count !== undefined && (
          <p className="mt-3 text-sm text-[#E4DDC4] font-mono">{event.attendee_count} going</p>
        )}
      </div>
    </div>
  );

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} relative min-h-screen text-[#E4DDC4] p-8`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-mono font-normal uppercase">My Events</h1>
        <Link
          href="/"
          className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
        >
          Back to Home
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search events..."
        className="w-full mb-8 p-4 rounded-lg bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] font-mono"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading ? (
        <p className="text-center">Loading events...</p>
      ) : signedOut && !isSupabaseConfigured() ? (
        <DemoRequired />
      ) : (
        <>
          <section className="mb-12">
            <h2 className="text-2xl mb-4 font-mono">Hosting</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostedEvents.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderEventCard)}
            </div>
          </section>

          <section>
            <h2 className="text-2xl mb-4 font-mono">Attending</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attendingEvents.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(renderEventCard)}
            </div>
          </section>
        </>
      )}

      {copied && (
        <div className="fixed bottom-4 left-1/2 w-[90%] sm:w-auto max-w-xs sm:max-w-sm transform -translate-x-1/2 bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] px-4 py-2 rounded-lg shadow-[4px_4px_0px_#000] text-base sm:text-xl font-mono animate-slide-in-out z-50 text-center">
          Event link copied to clipboard!
        </div>
      )}
    </main>
  );
}