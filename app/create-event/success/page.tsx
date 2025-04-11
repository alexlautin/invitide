'use client';
import Image from 'next/image';
import Link from 'next/link';
import './../../customCursor.css';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  created_at: string;
  // add more fields as needed
};

const Success: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  useEffect(() => {
    const fetchLatestEvent = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setEvent(data);
      }
    };

    fetchLatestEvent();
  }, []);

  return (
    <div className="min-h-screen bg-[#1F1F1F] text-[#E4DDC4] p-8 font-mono flex flex-col items-center justify-center">
      <div className="text-center">
        <Link href="/" className="absolute top-4 left-4 text-[#E4DDC4] text-xl hover:underline">
                ← Back
        </Link>
      <div className="w-full max-w-4xl flex-col sm:flex-row items-center justify-between border-[6px] border-[#E4DDC4] pt-5 rounded shadow-[6px_6px_0_#000]">
        <h1 className="text-4xl mb-4">Event Details</h1>
        {event ? (
          <div className="text-xl space-y-2 mb-6">
            <p><strong>Name:</strong> {event.name}</p>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Location:</strong> {event.location}</p>
          </div>
        ) : (
          <p className="text-lg mb-6">Loading event details...</p>
        )}
      </div>
      <div className="flex flex-col items-center mt-30 animate-bounce">
        <div className="relative bg-[#1F1F1F] border-[5px] border-[#E4DDC4] px-4 py-3 text-3xl rounded-lg shadow-[4px_4px_0_#000]" style={{ fontFamily: 'var(--font-vt323)' }}>
          <span>Event Created Successfully!</span>
          <div className="absolute bottom-[-13px] left-[calc(50%-13px)] w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
        </div>
        <Image
          src="/logo.png"
          alt="Invitide mascot"
          width={200}
          height={200}
          className="mt-5"
        />
      </div>
    </div>
    </div>
  );
};

export default Success;