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

export const metadata: Metadata = {
  title: "INVITIDE",
  description: "Ride the Wave of Connection.",
  openGraph: {
    type: 'website',
    title: 'INVITIDE',
    description: 'Ride the Wave of Connection.',
    siteName: 'INVITIDE',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'INVITIDE - Event Planning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INVITIDE',
    description: 'Ride the Wave of Connection.',
    images: ['/og-image.png'],
  },
};

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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="noise-overlay">{children}</div>
          <Analytics />
        </body>
      </html>
    </>
  );
}
