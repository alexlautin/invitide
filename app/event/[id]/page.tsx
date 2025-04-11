'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import QrScanner from 'qr-scanner';

import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';

const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', weight: ['400'] });
const vt323 = VT323({ subsets: ['latin'], variable: '--font-vt323', weight: ['400'] });

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  user_id: string;
  profiles?: { display_name: string } | null;
}

interface Attendee {
  id: string;
  user_id: string;
  display_name: string;
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [joinedUsers, setJoinedUsers] = useState<Attendee[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, profiles(display_name)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);

        // Check if user has RSVPed
        if (user) {
          const { data: rsvpData } = await supabase
            .from('event_attendees')
            .select('*')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .single();

          setIsRSVPed(!!rsvpData);
          if (user?.id && data?.user_id) {
            setIsHost(user.id === data.user_id);
            console.log('User is host:', user.id === data.user_id);
          }

          // If user is host, fetch attendees
          if (user.id === data.user_id) {
            const { data: attendeesRaw, error: attendeesError } = await supabase
              .from('event_attendees')
              .select('user_id')
              .eq('event_id', id);

            if (attendeesError) throw attendeesError;
            const userIds = attendeesRaw?.map(a => a.user_id) ?? [];

            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', userIds as string[]);

            if (profilesError) throw profilesError;
            const mappedAttendees = profilesData.map(profile => ({
              id: profile.id,
              user_id: profile.id,
              display_name: profile.display_name,
            }));

            setAttendees(mappedAttendees);

            // Fetch joined users
            const { data: joinedData } = await supabase
              .from('event_attendees')
              .select('user_id')
              .eq('event_id', id);

            const joinedUserIds = joinedData?.map(a => a.user_id) ?? [];

            const { data: joinedProfiles } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', joinedUserIds as string[]);

            const joined = (joinedProfiles ?? []).map(profile => ({
              id: profile.id,
              user_id: profile.id,
              display_name: profile.display_name,
            }));

            setJoinedUsers(joined);
          }
        }
      } catch (_err) {
        console.error('Error fetching event details,', _err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  const handleRSVP = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      if (isRSVPed) {
        // Remove RSVP
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', event?.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsRSVPed(false);
      } else {
        // Add RSVP
        const { error } = await supabase
          .from('event_attendees')
          .insert([
            {
              event_id: event?.id,
              user_id: user.id,
            },
          ]);

        if (error) throw error;
        setIsRSVPed(true);
      }
    } catch (err) {
      console.error('❌ Error updating RSVP status:', err);
      if (err instanceof Error) {
        console.error('🔍 Message:', err.message);
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!user || !event) return;

    setIsDeleting(true);
    try {
      // First delete all attendees for this event
      const { error: attendeesError } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', event.id);

      if (attendeesError) throw attendeesError;

      // Then delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
        .eq('user_id', user.id);

      if (eventError) throw eventError;

      // Redirect to profile page after successful deletion
      router.push('/my-events');
    } catch (_err) {
      console.error('Error deleting event', _err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!scanning) return;

    QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';
    const video = document.getElementById('qr-video') as HTMLVideoElement;
    let scanner: QrScanner | null = null;

    const startScanner = async () => {
      setScanStatus('Scanning in progress...');
      scanner = new QrScanner(
        video,
        async (result: string) => {
          console.log('Scanned result:', result);
          setScanStatus('Processing scanned data...');
          const scannedUserId = result;

          const { data, error } = await supabase
            .from('event_attendees')
            .upsert(
              { event_id: id, user_id: scannedUserId },
              { onConflict: ['event_id', 'user_id'] }
            );

          if (error) {
            console.error('🔥 Supabase upsert failed:', error);
            setScanStatus('Error adding attendee.');
          } else {
            console.log('✅ Supabase upsert result:', data);

            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id, display_name')
              .eq('id', scannedUserId)
              .single();

            if (profileError) {
              console.error('⚠️ Failed to fetch profile:', profileError);
              setScanStatus('User profile not found.');
            } else if (profile) {
              setJoinedUsers(prev => [
                ...prev,
                {
                  id: profile.id,
                  user_id: profile.id,
                  display_name: profile.display_name,
                },
              ]);
              setScanStatus('Scan successful!');
            }
          }
          
          setTimeout(() => {
            setScanning(false);
          }, 1000);
        }
      );

      setScanStatus('Scan a QR code');
      await scanner.start();
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, [scanning, id]);

  if (loading || !event) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <div className="text-2xl">Loading event details...</div>
      </main>
    );
  }

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
      <Link href="/my-events" className="absolute top-4 left-4 text-[#E4DDC4] hover:underline text-2xl">← Back to Events</Link>

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl w-full px-4">
          <div className="bg-[#1F1F1F] border-[5px] border-[#E4DDC4] rounded-lg p-8 shadow-[4px_4px_0px_#000]">
            {event.image_url?.trim() && (
              <Image src={event.image_url} alt={event.name} width={800} height={400} className="w-full h-64 object-cover rounded-lg" />
            )}

            <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-vt323)' }}>{event.name}</h1>

            <div className="mb-6">
              <p className="text-lg mb-4">{event.description}</p>
              <div className="flex flex-col gap-2">
                <p className="text-[#E4DDC4]">
                  <span className="font-semibold">Date & Time:</span>{' '}
                  {new Date(event.date).toLocaleString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-[#E4DDC4]">
                  <span className="font-semibold">Location:</span> {event.location}
                </p>
                <p className="text-[#E4DDC4]">
                  <span className="font-semibold">Created by:</span> @{event.profiles?.display_name ?? 'anonymous'}
                </p>
              </div>
            </div>

            {/* Attendees Section - Only visible to host */}
            {isHost && (
              <div className="mb-6">
                <h2 className="text-2xl font-mono mb-4">Attendees ({attendees.length})</h2>
                {attendees.length > 0 ? (
                  <div className="space-y-2">
                    {attendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className="flex items-center justify-between bg-[#1F1F1F] border-2 border-[#E4DDC4] p-3 rounded"
                      >
                        <div>
                          <p className="font-mono">@{attendee.display_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg">No attendees yet.</p>
                )}
              </div>
            )}

            {/* Joined Users Section - Only visible to host */}
            {isHost && (
              <div className="mb-6">
                <h2 className="text-2xl font-mono mb-4">Joined Users ({joinedUsers.length})</h2>
                {joinedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {joinedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between bg-[#1F1F1F] border-2 border-[#E4DDC4] p-3 rounded">
                        <p className="font-mono">@{user.display_name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg">No joined users yet.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                {isHost === true ? (
                  <button
                    onClick={() => setScanning(true)}
                    className="flex-1 border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Scan QR Code
                  </button>
                ) : (
                  <button
                    onClick={handleRSVP}
                    className={`flex-1 border-[4px] text-[18px] font-mono px-4 py-2 uppercase transition duration-300 ${isRSVPed
                      ? 'bg-[#E4DDC4] text-[#1F1F1F]'
                      : 'border-[#E4DDC4] hover:bg-[#E4DDC4] hover:text-[#1F1F1F]'
                      }`}
                  >
                    {isRSVPed ? 'Cancel RSVP' : 'RSVP'}
                  </button>
                )}
                <button
                  onClick={() => {
                    const eventUrl = `${window.location.origin}/event/${event.id}`;
                    navigator.clipboard.writeText(eventUrl).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="flex-1 border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                >
                  Copy Event Link
                </button>

              </div>
              <div className="mt-2">
                <button
                  onClick={() => {
                    if (!event) return;

                  const pad = (n: number) => n.toString().padStart(2, '0');
                  
                  const formatDate = (date: Date) => {
                    return (
                      date.getUTCFullYear().toString() +
                      pad(date.getUTCMonth() + 1) +
                      pad(date.getUTCDate()) +
                      'T' +
                      pad(date.getUTCHours()) +
                      pad(date.getUTCMinutes()) +
                      pad(date.getUTCSeconds()) +
                      'Z'
                    );
                  };
                  
                  const now = new Date();
                  const start = new Date(event.date);
                  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2-hour default duration
                  
                  const icsContent = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0',
                    'CALSCALE:GREGORIAN',
                    'BEGIN:VEVENT',
                    `UID:${event.id}@invitide`,
                    `SUMMARY:${event.name}`,
                    `DESCRIPTION:${event.description || ''}`,
                    `LOCATION:${event.location}`,
                    `DTSTAMP:${formatDate(now)}`,
                    `DTSTART:${formatDate(start)}`,
                    `DTEND:${formatDate(end)}`,
                    'END:VEVENT',
                    'END:VCALENDAR'
                  ].join('\r\n');

                    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${event.name.replace(/\\s+/g, '_')}.ics`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                >
                  Add to Calendar
                </button>
              </div>
              {isHost && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="border-[4px] text-[18px] font-mono border-red-500 text-red-500 px-4 py-2 uppercase hover:bg-red-500 hover:text-[#1F1F1F] transition duration-300"
                  >
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1F1F1F] border-[5px] border-[#E4DDC4] rounded-lg p-8 shadow-[4px_4px_0px_#000] max-w-md w-full mx-4">
            <h2 className="text-2xl font-mono mb-4">Delete Event</h2>
            <p className="mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="border-[4px] text-[18px] font-mono border-red-500 text-red-500 px-4 py-2 uppercase hover:bg-red-500 hover:text-[#1F1F1F] transition duration-300"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-[#1F1F1F] p-6 rounded-lg border-4 border-[#E4DDC4]">
            <h2 className="text-xl font-mono mb-4 text-center">Scan QR Code</h2>
            {scanStatus && (
              <div className="text-center mb-2 font-mono text-lg text-[#E4DDC4]">
                {scanStatus}
              </div>
            )}
            <video id="qr-video" className="w-full max-w-sm border border-[#E4DDC4] rounded"></video>
            <p className="mt-4 text-center text-[#E4DDC4]">{scanStatus}</p>
            <button onClick={() => setScanning(false)} className="mt-4 w-full border-[4px] text-[18px] font-mono border-red-500 text-red-500 px-4 py-2 uppercase hover:bg-red-500 hover:text-[#1F1F1F] transition duration-300">Cancel</button>
          </div>
        </div>
      )}

      {copied && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] sm:w-auto max-w-xs sm:max-w-sm bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] px-4 py-2 rounded-lg shadow-[4px_4px_0px_#000] text-center text-base sm:text-xl font-mono animate-slide-in-out z-50">
          Event link copied to clipboard!
        </div>
      )}
    </main>
  );
}