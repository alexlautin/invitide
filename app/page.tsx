import React from 'react';
import Image from 'next/image';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';

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
  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-2 bg-[url('noise.svg')] bg-repeat`}>
      <h1 className="text-4xl font-mono font-normal p-2 uppercase mb-8">
        Invitide
      </h1>
      <div className="flex flex-1">
        <div className="flex flex-row justify-between items-start">
          {/* Left content block */}
          <div className="flex flex-col">
            <p className="text-[104px] uppercase p-2 pt-30 mb-2 ml-30 leading-none" style={{ fontFamily: 'var(--font-vt323)' }}>
              Ride the Wave <br />
              of Connection.
            </p>
            <p className="text-[42px] uppercase p-2 mb-4 ml-30 leading-none" style={{ fontFamily: 'var(--font-vt323)' }}>
              Create or join an event in seconds.
            </p>
            <div className="flex gap-4 ml-32">
              <button className="border-[4px] text-[30px] font-jetbrains font-normal border-[#E4DDC4] px-8 py-2 uppercase">Create Event</button>
              <button className="border-[4px] text-[30px] font-jetbrains font-normal border-[#E4DDC4] px-10 py-2 uppercase">Find Event</button>
            </div>
          </div>
          <div className="flex flex-col items-center mr-10 ml-50 mt-30">
          <div className="border border-[#E4DDC4] px-2 py-1 text-sm">
              LET&apos;S PLAN YOUR EVENT!
            </div>
            <Image 
              src="/logo.png"
              alt="logo"
              width={300}
              height={300}
              className="mb-2"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
