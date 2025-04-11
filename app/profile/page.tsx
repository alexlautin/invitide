'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import {QRCodeCanvas} from 'qrcode.react';
import Link from 'next/link';
import Image from 'next/image';

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

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  image_url: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'attended'>('created');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);
      setDisplayName(profileData?.display_name || '');
      
      // Fetch created events
      const { data: createdEventsData } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      setCreatedEvents(createdEventsData || []);

      // Fetch attended events (you'll need to implement this based on your event attendance system)
      const { data: attendedEventsData } = await supabase
        .from('event_attendees')
        .select('events(*)')
        .eq('user_id', session.user.id);

      setAttendedEvents(attendedEventsData?.map((ea: any) => ea.events) || []);
      
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error.message);
    } else {
      setProfile({ ...profile, display_name: displayName });
      setIsEditing(false);
    }
  };

  const renderEvents = (events: Event[]) => {
    if (events.length === 0) {
      return <p className="text-lg">No {activeTab} events yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => router.push(`/event/${event.id}`)}
            className="cursor-pointer bg-[#1F1F1F] border-[4px] border-[#E4DDC4] rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-300 shadow-[4px_4px_0px_#000]"
          >
            {event.image_url && (
              <Image
                src={event.image_url}
                alt={event.name}
                width={500}
                height={200}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <h3 className="text-xl font-mono mb-2 uppercase" style={{ fontFamily: 'var(--font-vt323)' }}>
                {event.name}
              </h3>
              <p className="text-[#E4DDC4] mb-4 font-mono">{event.description}</p>
              <div className="flex justify-between text-sm text-[#E4DDC4] font-mono">
                <span>
                  {new Date(event.date).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <p className="text-2xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-[#E4DDC4] hover:underline text-2xl font-mono uppercase">
          ← Back to Home
        </Link>
      </div>

      <h1 className="w-full text-right text-4xl font-mono font-normal p-2 uppercase mb-8">
        Profile
      </h1>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Profile Information */}
        <div className="bg-[#1F1F1F] border-[4px] border-[#E4DDC4] p-8 rounded-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-mono mb-4">Account Information</h2>
            <p className="text-lg">Email: {user?.email}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-mono mb-4">Profile Information</h2>
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-lg mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#1F1F1F] border-2 border-[#E4DDC4] p-2 text-[#E4DDC4]"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdateProfile}
                    className="border-[4px] text-lg font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="border-[4px] text-lg font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-4">Display Name: {profile?.display_name || 'Not set'}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="border-[4px] text-lg font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* User-Specific Attendance QR Code Section */}
          <div className="mt-8 bg-[#262626] border-[4px] border-[#E4DDC4] p-8 rounded-lg">
            <h2 className="text-2xl font-mono mb-4">Your Attendance QR Code</h2>
            <p className="mb-4 text-sm">
              This QR code is unique to your account. Event creators can scan it to mark your attendance at events.
            </p>
            {user && (
             <div className="flex justify-center">
             <QRCodeCanvas 
               value={JSON.stringify({ userId: user.id }).slice(11).slice(0, -2)} 
               size={256} 
             />
           </div>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-[#1F1F1F] border-[4px] border-[#E4DDC4] p-8 rounded-lg">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('created')}
              className={`text-xl font-mono px-6 py-2 uppercase transition duration-300 ${
                activeTab === 'created'
                  ? 'bg-[#E4DDC4] text-[#1F1F1F]'
                  : 'border-[4px] border-[#E4DDC4] hover:bg-[#E4DDC4] hover:text-[#1F1F1F]'
              }`}
            >
              Created Events
            </button>
            <button
              onClick={() => setActiveTab('attended')}
              className={`text-xl font-mono px-6 py-2 uppercase transition duration-300 ${
                activeTab === 'attended'
                  ? 'bg-[#E4DDC4] text-[#1F1F1F]'
                  : 'border-[4px] border-[#E4DDC4] hover:bg-[#E4DDC4] hover:text-[#1F1F1F]'
              }`}
            >
              Attended Events
            </button>
          </div>

          {activeTab === 'created' ? renderEvents(createdEvents) : renderEvents(attendedEvents)}
        </div>
      </div>
    </main>
  );
}
