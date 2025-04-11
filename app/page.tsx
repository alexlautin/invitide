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

const ScrollingText = ({ text }: { text: string }) => {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div className="animate-scroll inline-block">
        {text}
      </div>
    </div>
  );
};

const styles = `
  @keyframes scroll {
    0% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  .animate-scroll {
    animation: scroll 10s linear infinite;
  }
`;

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
      <style>{styles}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl uppercase font-mono">Invitide</h1>
        
        {/* Auth Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!loading && user ? (
            <>
              <Link 
                href="/profile" 
                className="border-[2px] sm:border-[4px] text-[14px] sm:text-[16px] font-mono border-[#E4DDC4] px-1 sm:px-2 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300 min-w-[80px] max-w-[150px] overflow-hidden h-[32px] flex items-center"
              >
                {displayName && displayName.length > 12 ? (
                  <ScrollingText text={displayName} />
                ) : (
                  displayName ?? user.email
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="border-[2px] sm:border-[4px] border-[#E4DDC4] px-2 sm:px-3 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition text-[14px] sm:text-[16px] h-[32px] flex items-center justify-center min-w-[80px] font-mono"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="border-[2px] sm:border-[4px] border-[#E4DDC4] px-2 sm:px-3 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition text-[14px] sm:text-[16px] h-[32px] flex items-center justify-center min-w-[80px] font-mono"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="border-[2px] sm:border-[4px] border-[#E4DDC4] px-2 sm:px-3 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition text-[14px] sm:text-[16px] h-[32px] flex items-center justify-center min-w-[80px] font-mono"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 items-center justify-center flex-1 max-w-7xl mx-auto">
        {/* Left Side */}
        <div className="flex flex-col text-center lg:text-left max-w-2xl">
          <p
            className="text-3xl sm:text-4xl md:text-6xl lg:text-[104px] uppercase mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-vt323)' }}
          >
            Ride the Wave <br />
            of Connection.
          </p>
          <p
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl uppercase mb-6"
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
              className="border-[4px] text-lg sm:text-xl md:text-2xl border-[#E4DDC4] px-4 sm:px-6 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition"
            >
              Create Event
            </button>
            <Link
              href="/my-events"
              className="border-[4px] text-xl sm:text-2xl border-[#E4DDC4] px-6 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition text-center"
            >
              My Events
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center">
          <div className="relative border-[5px] border-[#E4DDC4] px-4 py-3 text-xl sm:text-2xl md:text-4xl rounded-lg shadow-[4px_4px_0px_#000] text-center" style={{ fontFamily: 'var(--font-vt323)' }}>
            <span className="block">LET&apos;S PLAN YOUR EVENT!</span>
            <div className="absolute bottom-[-13px] left-[calc(50%-13px)] w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
          </div>
          <Image
            src="/logo.png"
            alt="logo"
            width={200}
            height={200}
            className="mt-6 w-[150px] sm:w-[200px] md:w-[250px]"
          />
        </div>
      </div>
    </main>
  );
}