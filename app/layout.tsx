'use client';

import type { Metadata } from "next";
import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import "./customCursor.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#1F1F1F] text-[#E4DDC4]`}
        >
          {/* CRT Overlay Effect */}
          <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute inset-0 bg-[rgba(0,0,0,0.1)]" style={{
              backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
              backgroundSize: '100% 4px',
            }}></div>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 100%)',
            }}></div>
          </div>

          {/* Scan Line Animation */}
          <div className="fixed inset-0 pointer-events-none z-50 animate-scan" style={{
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%)',
            backgroundSize: '100% 4px',
          }}></div>

          <div className="noise-overlay">{children}</div>
          <Analytics />

          <style jsx global>{`
            @keyframes scan {
              0% { transform: translateY(0); }
              100% { transform: translateY(100vh); }
            }
            .animate-scan {
              animation: scan 8s linear infinite;
            }
          `}</style>
        </body>
      </html>
    </>
  );
}
