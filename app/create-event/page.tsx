'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function CreateEventPage() {
    const router = useRouter();
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const {
            data: { user },
          } = await supabase.auth.getUser();
          
          const { data, error } = await supabase
            .from('events')
            .insert([
              {
                name: eventName,
                date: new Date(eventDate).toISOString().slice(0, 10),
                location: location,
                user_id: user?.id,
              },
            ])
            .select()
            .single();

        if (error) {
            setError(error.message);
        } else if (data) {
            router.push(`/event/${data.id}`);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#1F1F1F] text-[#E4DDC4] p-8 font-mono">
            <Link href="/" className="absolute top-4 left-4 text-[#E4DDC4] text-xl hover:underline">
                ← Back
            </Link>
            <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between border-[6px] border-[#E4DDC4] p-10 rounded shadow-[6px_6px_0_#000]">
                <div className="w-full sm:w-2/3">
                    <h1 className="text-4xl sm:text-5xl uppercase mb-8" style={{ fontFamily: 'var(--font-vt323)' }}>
                        Create Event
                    </h1>
                    <form onSubmit={handleCreate} className="space-y-4 w-full max-w-sm">
                        <div>
                            <label className="block mb-1 text-md uppercase">Event Name</label>
                            <input
                                type="text"
                                required
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-[#1F1F1F] text-[#E4DDC4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4DDC4]"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-md uppercase">Date</label>
                            <input
                                type="date"
                                required
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-[#1F1F1F] text-[#E4DDC4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4DDC4]"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-md uppercase">Location</label>
                            <input
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 bg-[#1F1F1F] text-[#E4DDC4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4DDC4]"
                            />
                        </div>
                        {error && <p className="text-red-500">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-[#E4DDC4] text-[#1F1F1F] text-xl px-4 py-2 uppercase border border-[#E4DDC4] hover:bg-[#d6d0b8] transition"
                        >
                            Create
                        </button>
                    </form>
                </div>
                <div className="hidden sm:flex flex-col items-center mt-8 sm:mt-0">
                    <div className="relative bg-[#1F1F1F] border-[5px] border-[#E4DDC4] px-4 py-3 text-3xl rounded-lg shadow-[4px_4px_0_#000]" style={{ fontFamily: 'var(--font-vt323)' }}>
                        <span>Let's Plan Your Event!</span>
                        <div className="absolute bottom-[-13px] left-[calc(50%-13px)] w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
                    </div>
                    <Image
                        src="/logo.png"
                        alt="Invitide mascot"
                        width={200}
                        height={200}
                        className={`mt-4`}
                    />
                </div>
            </div>
        </main>
    );
}