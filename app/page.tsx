'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';
import { supabase } from '@/lib/supabaseClient';
import './customCursor.css';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

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

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisplayName = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error.message);
        setLoading(false);
        return;
      }

      const user = session?.user ?? null;
      setUser(user);

      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        setDisplayName(profile?.display_name ?? null);
      }

      setLoading(false);
    };

    fetchDisplayName();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDisplayName(null);
    setUser(null);
  };

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-4`}>
      {/* Auth Links */}
      <div className="absolute top-4 right-4 flex flex-wrap gap-4 text-sm sm:text-base">
        {!loading && user ? (
          <>
            <Link href="/profile" className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300">
              {displayName ?? user.email}
            </Link>
            <button
              onClick={handleSignOut}
              className="border-[2px] sm:border-[4px] border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="border-[2px] sm:border-[4px] border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="border-[2px] sm:border-[4px] border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl uppercase font-mono mb-6">Invitide</h1>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-12 items-center justify-between flex-1">
        {/* Left Side */}
        <div className="flex flex-col text-center lg:text-left max-w-2xl">
          <p
            className="text-4xl sm:text-6xl md:text-7xl lg:text-[104px] uppercase mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-vt323)' }}
          >
            Ride the Wave <br />
            of Connection.
          </p>
          <p
            className="text-xl sm:text-2xl md:text-3xl uppercase mb-6"
            style={{ fontFamily: 'var(--font-vt323)' }}
          >
            Create or join an event in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => {
                if (!user) {
                  router.push('/login');
                } else {
                  router.push('/create-event');
                }
              }}
              className="border-[4px] text-xl sm:text-2xl border-[#E4DDC4] px-6 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition"
            >
              Create Event
            </button>
            <Link
              href="/find-events"
              className="border-[4px] text-xl sm:text-2xl border-[#E4DDC4] px-6 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition text-center"
            >
              Find Events
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center">
          <div className="relative border-[5px] border-[#E4DDC4] px-4 py-3 text-2xl sm:text-4xl rounded-lg shadow-[4px_4px_0px_#000] text-center" style={{ fontFamily: 'var(--font-vt323)' }}>
            <span className="block">LET&apos;S PLAN YOUR EVENT!</span>
            <div className="absolute bottom-[-13px] left-[calc(50%-13px)] w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
          </div>
          <Image
            src="/logo.png"
            alt="logo"
            width={250}
            height={250}
            className="mt-6"
          />
        </div>
      </div>
    </main>
  );
}