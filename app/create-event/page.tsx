'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';


export default function CreateEventPage() {
    const router = useRouter();
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true); // Add loading state for initial load
    const [user, setUser] = useState<User | null>(null);
    const [eventTime, setEventTime] = useState('');

    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Error fetching session:', error.message);
                setLoading(false);  // Set loading to false if error occurs
                return;
            }
            
            if (session?.user) {
                setUser(session.user);  // Store user info in state
            }
            
            setLoading(false); // Stop loading once session is checked
        };
        
        fetchSession(); // Check session on initial page load
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError("You must be signed in to create an event.");
            return;
        }
        const eventDateTime = eventTime
            ? new Date(`${eventDate}T${eventTime}`).toISOString()
            : new Date(`${eventDate}T00:00`).toISOString();
        console.log('Creating event with datetime:', eventDateTime);

        const { data, error } = await supabase
            .from('events')
            .insert([
                {
                    name: eventName,
                    date: eventDateTime,
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

    if (loading) {
        return <div>Loading...</div>; // Show loading screen until session is verified
    }

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
                            <div className="relative">
                                <input
                                    type="date"
                                    required
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 bg-[#1F1F1F] text-[#E4DDC4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4DDC4] appearance-none"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E4DDC4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 text-md uppercase">Time (Optional)</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 bg-[#1F1F1F] text-[#E4DDC4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4DDC4] appearance-none"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E4DDC4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
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
                        <span>Let&apos;s Plan Your Event!</span>                        <div className="absolute bottom-[-13px] left-[calc(50%-13px)] w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
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