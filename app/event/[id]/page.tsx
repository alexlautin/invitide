'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setEvent(data);
      }
      setLoading(false);
    };

    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-[#1F1F1F] text-[#E4DDC4] flex items-center justify-center font-mono">Loading...</div>;
  }

  if (!event) {
    return <div className="min-h-screen bg-[#1F1F1F] text-[#E4DDC4] flex items-center justify-center font-mono">Event not found.</div>;
  }

  return (
    <main className="min-h-screen bg-[#1F1F1F] text-[#E4DDC4] p-8 font-mono flex flex-col items-center justify-center">
        <Link href="/" className="absolute top-4 left-4 text-[#E4DDC4] text-xl hover:underline">
                ← Back
            </Link>
      <div className="border-[6px] border-[#E4DDC4] p-8 rounded shadow-[6px_6px_0_#000] max-w-lg w-full">
        <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-vt323)' }}>{event.name}</h1>
        <p className="mb-2"><strong>Date:</strong> {event.date}</p>
        <p><strong>Location:</strong> {event.location}</p>
      </div>
    </main>
  );
}