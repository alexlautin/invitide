'use client';
import { use } from 'react';
import Head from 'next/head';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import QrScanner from 'qr-scanner';
// import { generateEventImage } from '@/utils/gemini';

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
  meeting_link?: string | null;
  profiles?: { display_name: string } | null;
}

interface Attendee {
  id: string;
  user_id: string;
  display_name: string;
}

export default function EventPage({ params: rawParams }: { params: Promise<{ id: string }> }) {
  const params = use(rawParams);
  console.log('Rendering EventPage for event ID:', params.id);

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
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  // const [ setGeneratedText] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            console.log('User session loaded:', session.user);
            setUser(session.user);
        } else {
            console.error('No user session found.');
        }
    };

    checkSession();
}, []);

  useEffect(() => {
    if (!event || !user) {
      console.log('Waiting for event and user data to load.');
      return;
    }

    const createVideoCallLink = async () => {
      try {
        if (!event.meeting_link) {
          const uniqueRoomName = `event-room-${Date.now()}`;
          const jitsiMeetingLink = `https://meet.jit.si/${uniqueRoomName}`;

          const { data, error } = await supabase
            .from('events')
            .update({ meeting_link: jitsiMeetingLink })
            .eq('id', event.id)
            .select('meeting_link')
            .single();

          if (error) {
            console.error('Error saving meeting link to database:', error);
            return;
          }

          if (data?.meeting_link) {
            setMeetingLink(data.meeting_link);
          }
        } else {
          setMeetingLink(event.meeting_link);
        }
      } catch (error) {
        console.error('Error creating video call link:', error);
      }
    };

    createVideoCallLink();
  }, [event, user]);

useEffect(() => {
    if (!id) {
        console.error('Event ID is missing. Cannot fetch attendees.');
        return;
    }

    if (!user) {
      console.error('[Error] User session not loaded yet — delaying attendee fetch.');
      return;
    }

    console.log('Fetching attendees for event ID:', id, 'and user:', user.id);

    const fetchAttendees = async () => {
        try {
            const { data, error } = await supabase
                .from('event_attendees')
                .select('user_id, profiles(display_name)')
                .eq('event_id', id);

            if (error) {
                console.error('Error fetching attendees from Supabase:', error);
                return;
            }

            if (!data) {
                console.error('No attendees found for the given event ID.');
                return;
            }

            const mappedAttendees = data.map((attendee) => ({
                id: attendee.user_id, // Use user_id as id
                user_id: attendee.user_id,
                display_name: attendee.profiles[0]?.display_name || 'Unknown', // Extract display_name from profiles
            }));

            setAttendees(mappedAttendees);
        } catch (_err) {
            console.error('Unexpected error fetching attendees:', _err);
        }
    };

    fetchAttendees();
}, [id, user]);

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

  useEffect(() => {
    if (event?.meeting_link) {
      setMeetingLink(event.meeting_link);
    }
  }, [event]);

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

  // async function handleGenerateImage() {
  //   if (!event) return;

  //   const retryFetch = async (url, options, retries = 3, delay = 1000) => {
  //     for (let i = 0; i < retries; i++) {
  //       const response = await fetch(url, options);
  //       if (response.ok) return response;
  //       if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
  //     }
  //     throw new Error('API request failed after retries');
  //   };

  //   try {
  //     const prompt = `Generate an image for the event named '${event.name}' with a theme that matches its description.`;
  //     const response = await retryFetch('/api/generate-content', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ prompt }),
  //     });

  //     const data = await response.json();
  //     console.log('API Response:', data);

  //     if (data && data.contents && data.contents[0]?.parts[0]?.text) {
  //       setGeneratedText(data.contents[0].parts[0].text);
  //     } else {
  //       setGeneratedText('No text generated from the API response.');
  //     }
  //   } catch (error) {
  //     console.error('Error generating image:', error);
  //     if (error.message.includes('overloaded')) {
  //       setGeneratedText('The model is currently overloaded. Please try again in a few minutes.');
  //     } else {
  //       setGeneratedText('An unexpected error occurred. Please try again later.');
  //     }
  //   }
  // }

  async function handleGenerateDescription() {
    if (!event) return;

    interface RetryFetchOptions {
      method: string;
      headers: Record<string, string>;
      body?: string;
    }

    const retryFetch = async (
      url: string,
      options: RetryFetchOptions,
      retries: number = 3,
      delay: number = 1000
    ): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
      const response: Response = await fetch(url, options);
      if (response.ok) return response;
      if (i < retries - 1) await new Promise((resolve) => setTimeout(resolve, delay));
      }
      throw new Error('API request failed after retries');
    };

    try {
      const prompt = `Write a short and engaging description for the event named '${event.name}' happening at ${event.location} on ${new Date(event.date).toLocaleDateString()} It should be one sentence. Only give one response and one option. You are a moderated chat bot, so no explicit phrases or anything you deem inappropriate will be tolerated. The title may not include any such thing that you do not think is appropriate. You do not have to generate anything that goes against your filter.`;
      const response = await retryFetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      console.log('API Response:', data); // Log the full API response for debugging

      const generatedDescription = data?.text || 'No description generated.';

      // Update the event description in the database
      const { error } = await supabase
        .from('events')
        .update({ description: generatedDescription })
        .eq('id', event.id);

      if (error) {
        console.error('Error updating event description:', error);
        return;
      }

      // Update the local state
      setEvent((prev) => prev ? { ...prev, description: generatedDescription } : prev);

      if (data && data.contents && data.contents[0]?.parts[0]?.text) {
        setGeneratedDescription(data.contents[0].parts[0].text);
      } else {
        setGeneratedDescription(data.text ?? JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.error('Error generating description:', error);
      if (error instanceof Error && error.message.includes('overloaded')) {
        setGeneratedDescription('The model is currently overloaded. Please try again in a few minutes.');
      } else {
        setGeneratedDescription('An unexpected error occurred. Please try again later.');
      }
    }
  }

  useEffect(() => {
    if (!scanning) return;

    let scanner: QrScanner | null = null;
    const video = document.getElementById('qr-video') as HTMLVideoElement;

    const startScanner = async () => {
      setScanStatus('Initializing scanner...');
      
      // Simple QR scanner without custom overlay
      let hasScanned = false;
      
      scanner = new QrScanner(
        video,
        result => {
          if (hasScanned) return;
          hasScanned = true;
          console.log('Scanned result:', result.data);
          setScanStatus('Processing scanned data...');
          const scannedUserId = result.data;
          
          // Process the result
          handleScannedCode(scannedUserId);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true, // Use built-in highlighting instead
        }
      );
      
      await scanner.start();
      setScanStatus('Scanner is active. Please align the QR code.');
    };

    // Function to handle the scanned code data
    const handleScannedCode = async (scannedUserId: string) => {
      try {
        // Try to parse JSON if the string looks like JSON
        let userId = scannedUserId;
        if (scannedUserId.includes('{') && scannedUserId.includes('}')) {
          try {
            const jsonData = JSON.parse(scannedUserId);
            userId = jsonData.userId || scannedUserId;
          } catch (e) {
            console.error('Failed to parse QR JSON:', e);
            // Continue with the original string if parsing fails
          }
        }

        console.log('Processing user ID:', userId);
        
        const { error } = await supabase
          .from('event_attendees')
          .upsert({ event_id: id, user_id: userId }, { onConflict: 'event_id,user_id' });

        if (!error) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name')
            .eq('id', userId)
            .single();

          if (profile) {
            setJoinedUsers(prev => {
              // Check if user already exists in the array to prevent duplicates
              if (prev.some(user => user.id === profile.id)) {
                return prev;
              }
              return [
                ...prev,
                {
                  id: profile.id,
                  user_id: profile.id,
                  display_name: profile.display_name,
                },
              ];
            });
            setScanStatus('Scan successful!');
            setTimeout(() => setScanning(false), 1500);
          } else {
            setScanStatus('User profile not found.');
          }
        } else {
          console.error('Error adding attendee:', error);
          setScanStatus(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error processing QR code:', error);
        setScanStatus('Error processing QR code.');
      }
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
    <>
      <Head>
        <title>{event.name} | Invitide</title>
        <meta property="og:title" content={event.name} />
        <meta property="og:description" content={`Join us on ${new Date(event.date).toLocaleString()}`} />
        <meta property="og:image" content={event.image_url} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://invitide.com/event/${event.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.name} />
        <meta name="twitter:description" content={`Join us on ${new Date(event.date).toLocaleString()}`} />
        <meta name="twitter:image" content={event.image_url} />
      </Head>
      <main className={`${jetBrainsMono.variable} ${vt323.variable} pt-16 sm:pt-8 min-h-screen flex flex-col text-[#E4DDC4] p-8`}>
        <Link href="/my-events" className="absolute top-4 left-4 text-[#E4DDC4] hover:underline text-2xl">← Back to Events</Link>

      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-2xl w-full px-4">
          <div className="bg-[#1F1F1F] border-[5px] border-[#E4DDC4] rounded-lg p-8 shadow-[4px_4px_0px_#000]">
            {event.image_url?.trim() && (
              <Image src={event.image_url} alt={event.name} width={800} height={400} className="w-full h-64 object-cover rounded-lg" />
            )}

            <h1 className="text-4xl mb-4" style={{ fontFamily: 'var(--font-vt323)' }}>{event.name}</h1>

            <div className="mb-6">
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
                  <span className="font-semibold">Description:</span> {generatedDescription?.trim() || (event.description ? `${event.description} ✨ AI GENERATED ✨` : 'No description available.')}
                </p>
                <p className="text-[#E4DDC4]">
                  <span className="font-semibold">Created by:</span> @{event.profiles?.display_name ?? 'anonymous'}
                </p>
              </div>
            </div>

            {/* Attendees Section - Only visible to host */}
            {isHost && (
              <div className="host-section mb-6">
                <h2 className="text-2xl font-mono mb-4">Attendees ({attendees.length})</h2>
                {attendees.length > 0 ? (
                  <div className="space-y-2">
                    {attendees.map((attendee) => (
                      <div
                        key={attendee.user_id}
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
              <div className="host-section mb-6">
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
              <div className="flex flex-col sm:flex-row gap-4">
                {isHost ? (
                  <button
                    onClick={() => setScanning(true)}
                    className="block w/full whitespace-nowrap border-[4px] text-[18px] font-mono text-center border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Scan QR Code
                  </button>
                ) : (
                  <button
                    onClick={handleRSVP}
                    className={`block w-full border-[4px] text-[18px] font-mono text-center px-4 py-2 uppercase transition duration-300 ${
                      isRSVPed
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
                  className="block w-full whitespace-nowrap border-[4px] text-[18px] font-mono text-center border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                >
                  Copy Event Link
                </button>
                {meetingLink && (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w/full border-[4px] text-[18px] font-mono text-center border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Video Call
                  </a>
                )}
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
              {/* {isHost && (
                <div className="mt-2">
                  <button
                    onClick={handleGenerateImage}
                    className="w-full border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Generate Event Image
                  </button>
                  {generatedText && (
                    <p className="mt-4 text-center text-[#E4DDC4]">{generatedText}</p>
                  )}
                </div>
              )} */}
              {isHost && (
                <div className="mt-2">
                  <button
                    onClick={handleGenerateDescription}
                    className="w-full border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Generate AI Event Description
                  </button>
                  {/* {generatedDescription && (
                    <p className="mt-4 text-center text-[#E4DDC4]">{generatedDescription}</p>
                  )} */}
                </div>
              )}
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
          <div className="bg-[#1F1F1F] p-6 rounded-lg border-4 border-[#E4DDC4] w-full max-w-sm mx-auto">
            <h2 className="text-xl font-mono mb-4 text-center">Scan QR Code</h2>
            {scanStatus && (
              <div className="text-center mb-2 font-mono text-lg text-[#E4DDC4]">
                {/* {scanStatus} */}
              </div>
            )}
            <div className="relative">
              <video id="qr-video" className="w-full max-w-sm border border-[#E4DDC4] rounded"></video>
              {/* QR code scanning guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-3/4 border-4 border-[#E4DDC4] rounded-xl opacity-50 animate-pulse"></div>
              </div>
            </div>
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
      <style jsx>{`
        /* Adjust spacing for mobile view */
        @media (max-width: 640px) {
          .fixed.bottom-4.left-1\/2.transform.-translate-x-1\/2.w-\[90\%\] {
            padding: 1rem;
            margin: 0 auto;
          }

          .w-full.max-w-sm {
            margin: 0 auto;
            padding: 1rem;
          }

          .mt-4.w-full {
            margin-top: 1rem;
          }
        }

        /* Adjust spacing for the back-to-events link on mobile */
        @media (max-width: 640px) {
          .absolute.top-4.left-4 {
            top: 1.5rem;
            left: 1.5rem;
            font-size: 1.25rem;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }
        }

        /* Adjust spacing for host-specific elements on mobile */
        @media (max-width: 640px) {
          .host-section {
            margin-top: 1.5rem;
            padding: 1rem;
          }

          .host-section h2 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
          }

          .host-section .space-y-2 > div {
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </>
  );
}