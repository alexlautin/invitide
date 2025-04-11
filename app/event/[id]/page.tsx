'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image'; // Make sure this is imported at the top
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image_url: string;
  user_id: string;
  profiles?: {
    display_name: string;
  } | null;
}

interface Attendee {
  id: string;
  user_id: string;
  profiles: {
    display_name: string;
    email: string;
  };
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cameFromProfile, setCameFromProfile] = useState(false);

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
          setIsHost(user.id === data.user_id);

          // If user is host, fetch attendees
          if (user.id === data.user_id) {
            const { data: attendeesData } = await supabase
              .from('event_attendees')
              .select('*, profiles(display_name, email)')
              .eq('event_id', id);

            setAttendees(attendeesData || []);
          }
        }
      } catch (err) {
        setError('Error fetching event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  useEffect(() => {
    // Check if user came from profile page
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      setCameFromProfile(referrer.includes('/profile'));
    }
  }, []);

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
      setError('Error updating RSVP status');
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
      router.push('/profile');
    } catch (err) {
      setError('Error deleting event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <div className="text-2xl">Loading event details...</div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex items-center justify-center text-[#E4DDC4]`}>
        <div className="text-2xl text-red-500">{error || 'Event not found'}</div>
      </main>
    );
  }

  return (
    <main className={`${jetBrainsMono.variable} ${vt323.variable} min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
      <div className="absolute top-4 left-4">
        <Link 
          href={cameFromProfile ? "/profile" : "/find-events"} 
          className="border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
        >
          ← Back to {cameFromProfile ? "Profile" : "Events"}
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl w-full px-4">
          <div className="bg-[#1F1F1F] border-[5px] border-[#E4DDC4] rounded-lg p-8 shadow-[4px_4px_0px_#000]">
            {event.image_url?.trim() ? (
              <Image
                src={event.image_url}
                alt={event.name}
                width={800}
                height={400}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : null}

            <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-vt323)' }}>
              {event.name}
            </h1>

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
                          <p className="font-mono">@{attendee.profiles.display_name}</p>
                          <p className="text-sm text-[#E4DDC4]/70">{attendee.profiles.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg">No attendees yet.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <button
                  onClick={handleRSVP}
                  className={`flex-1 border-[4px] text-[18px] font-mono px-4 py-2 uppercase transition duration-300 ${
                    isRSVPed
                      ? 'bg-[#E4DDC4] text-[#1F1F1F]'
                      : 'border-[#E4DDC4] hover:bg-[#E4DDC4] hover:text-[#1F1F1F]'
                  }`}
                >
                  {isRSVPed ? 'Cancel RSVP' : 'RSVP'}
                </button>
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

      {copied && (
        <div className="fixed bottom-4 left-1/2 w-[90%] sm:w-auto max-w-xs sm:max-w-sm transform -translate-x-1/2 bg-[#1F1F1F] border-[4px] border-[#E4DDC4] text-[#E4DDC4] px-4 py-2 rounded-lg shadow-[4px_4px_0px_#000] text-base sm:text-xl font-mono animate-slide-in-out z-50 text-center">
          Event link copied to clipboard!
        </div>
      )}
    </main>
  );
}