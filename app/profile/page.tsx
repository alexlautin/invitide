'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import {QRCodeCanvas} from 'qrcode.react';

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

interface Profile {
  id: string;
  display_name: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error.message);
    } else {
      setProfile({
        id: profile.id,
        display_name: displayName,
      });
      setIsEditing(false);
    }
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
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="text-[#E4DDC4] mb-6 hover:underline text-lg w-fit"
      >
        ← Back
      </button>

      <h1 className="text-4xl font-mono font-normal p-2 uppercase mb-8">
        Profile
      </h1>

      <div className="max-w-2xl mx-auto w-full">
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
              <QRCodeCanvas value={JSON.stringify({ userId: user.id }).slice(11).slice(0,-2)} size={256} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
