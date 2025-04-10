'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';
import { supabase } from '@/lib/supabaseClient';
import '../customCursor.css';

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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user.email ?? null);
    };

    fetchSession();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-2`}>
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {userEmail ? (
          <>
            <span className="text-[18px] font-mono text-[#E4DDC4]">Welcome, {userEmail}</span>
            <button
              onClick={handleSignOut}
              className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-1 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="border-[4px] text-[25px] font-mono font-normal border-[#E4DDC4] px-4 py-0 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300">
              Login
            </Link>
            <Link href="/signup" className="border-[4px] text-[25px] font-mono font-normal border-[#E4DDC4] px-4 py-0 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300">
              Sign Up
            </Link>
          </>
        )}
      </div>
      <h1 className="text-4xl font-mono font-normal p-2 uppercase mb-8">
        Invitide
      </h1>
      <div className="flex flex-1">
        <div className="flex flex-row justify-between items-start">
          {/* Left content block */}
          <div className="flex flex-col">
          <p className="text-[42px] uppercase p-2 mb-4 ml-30 pt-20 leading-none" style={{ fontFamily: 'var(--font-vt323)' }}>
              Enter Invite Code
            </p>
            <p className="text-[104px] uppercase p-2 pt-0 mb-2 ml-30 leading-none" style={{ fontFamily: 'var(--font-vt323)' }}>
              Enter Your <br />
              Invite Code.
            </p>
            <p className="text-[42px] uppercase p-2 mb-4 ml-30 leading-none" style={{ fontFamily: 'var(--font-vt323)' }}>
              Create or join an event in seconds.
            </p>
            <div className="flex gap-4 ml-32">
              <Link href="/create-event">
              <button className="border-[4px] text-[30px] font-mono font-normal border-[#E4DDC4] px-8 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300">
                Create Event
              </button>
              </Link>
              <button className="border-[4px] text-[30px] font-mono font-normal border-[#E4DDC4] px-8 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300">
                Join Event
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center mr-10 ml-50 mt-30">
            <div className="group flex flex-col items-center">
              <div className="relative bg-[#1F1F1F] ml-10 border-[5px] border-[#E4DDC4] text-[#E4DDC4] px-4 py-3 text-4xl rounded-lg shadow-[4px_4px_0px_#000]" style={{ fontFamily: 'var(--font-vt323)' }}>
                <span className="block leading-tight">
                  LET&apos;S PLAN YOUR EVENT!
                </span>
                <div className="absolute bottom-[-13px] left-[calc(50%-13px)] w-0 h-0 border-l-[13px] border-r-[13px] border-t-[13px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
                <div className="absolute bottom-[-11px] left-[calc(50%-11px)] w-0 h-0 border-l-[11px] border-r-[11px] border-t-[11px] border-l-transparent border-r-transparent border-t-[#E4DDC4]" />
              </div>
              <Image 
                src="/logo.png"
                alt="logo"
                width={300}
                height={300}
                className="mb-2 group-hover:animate-bounce"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
