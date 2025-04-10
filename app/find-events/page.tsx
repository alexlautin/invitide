'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';
import Link from 'next/link';

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
  title: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
}

export default function FindEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-mono font-normal uppercase">Find Events</h1>
        <Link 
          href="/" 
          className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
        >
          Back to Home
        </Link>
      </div>
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search events..."
          className="w-full p-4 rounded-lg bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] focus:outline-none focus:ring-2 focus:ring-[#E4DDC4] font-mono"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center text-[#E4DDC4] font-mono">Loading events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-[#1F1F1F] border-[4px] border-[#E4DDC4] rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-300 shadow-[4px_4px_0px_#000]"
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-mono mb-2 uppercase" style={{ fontFamily: 'var(--font-vt323)' }}>
                  {event.title}
                </h2>
                <p className="text-[#E4DDC4] mb-4 font-mono">{event.description}</p>
                <div className="flex justify-between text-sm text-[#E4DDC4] font-mono">
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center text-[#E4DDC4] font-mono">
          No events found matching your search.
        </div>
      )}
    </main>
  );
} 