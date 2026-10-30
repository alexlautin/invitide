'use client';
import { use } from 'react';
import Head from 'next/head';

import { useEffect, useRef, useState } from 'react';
import {
  getCurrentUser,
  getEvent,
  getRoster,
  isRsvped,
  setRsvp,
  deleteEvent,
  ensureMeetingLink,
  generateDescription,
  saveDescription,
  checkInAttendee,
  sendInvite,
  type AppUser,
  type Attendee,
  type EventRecord,
} from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QrScanner from 'qr-scanner';
import { useDemoMode } from '@/lib/demo/useDemoMode';
// import { generateEventImage } from '@/utils/gemini';

import { JetBrains_Mono } from 'next/font/google';
import { VT323 } from 'next/font/google';

const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', weight: ['400'] });
const vt323 = VT323({ subsets: ['latin'], variable: '--font-vt323', weight: ['400'] });

export default function EventPage({ params: rawParams }: { params: Promise<{ id: string }> }) {
  const params = use(rawParams);

  const router = useRouter();
  const demo = useDemoMode();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [joinedUsers, setJoinedUsers] = useState<Attendee[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>("idle");
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((sessionUser) => {
      if (sessionUser) setUser(sessionUser);
      else console.error('No user session found.');
    });
  }, []);

  useEffect(() => {
    if (!event || !user) return;

    const createVideoCallLink = async () => {
      try {
        const { link, error } = await ensureMeetingLink(event);
        if (error) {
          console.error('Error saving meeting link to database:', error);
          alert('Error saving meeting link: ' + JSON.stringify(error));
          return;
        }
        if (link) setMeetingLink(link);
      } catch {
        console.error('Error creating video call link');
      }
    };

    createVideoCallLink();
  }, [event, user]);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        const data = await getEvent(id);
        setEvent(data);

        if (user && data) {
          setIsRSVPed(await isRsvped(id, user.id));
          const host = user.id === data.user_id;
          setIsHost(host);

          if (host) {
            const roster = await getRoster(id);
            setAttendees(roster.attendees);
            setJoinedUsers(roster.joined);
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
    if (!event) return;

    const { error } = await setRsvp(event.id, user.id, !isRSVPed);
    if (error) {
      console.error('❌ Error updating RSVP status:', error);
      return;
    }
    setIsRSVPed(!isRSVPed);
  };

  const handleDeleteEvent = async () => {
    if (!user || !event) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteEvent(event.id, user.id);
      if (error) throw new Error(error);
      router.push('/my-events');
    } catch (_err) {
      console.error('Error deleting event', _err);
    } finally {
      setIsDeleting(false);
    }
  };

  async function handleGenerateDescription() {
    if (!event) return;

    setGenerating(true);
    try {
      const text = await generateDescription(event);

      const { error } = await saveDescription(event.id, text);
      if (error) return;

      setEvent((prev) => prev ? { ...prev, description: text, ai_generated: true } : prev);
      setGeneratedDescription(text);
    } catch (error) {
      console.error('Error generating description:', error);
      if (error instanceof Error && error.message.includes('overloaded')) {
        setGeneratedDescription('The model is currently overloaded. Please try again in a few minutes.');
      } else {
        setGeneratedDescription('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setGenerating(false);
    }
  }

  // Check in whoever the scanned (or typed) code belongs to.
  const processCode = async (code: string) => {
    try {
      const { profile, error, alreadyCheckedIn } = await checkInAttendee(id, code);
      if (error || !profile) {
        setScanStatus(!error || error === 'User profile not found.' ? 'User profile not found.' : `Error: ${error}`);
        return;
      }

      setJoinedUsers((prev) =>
        prev.some((u) => u.id === profile.id)
          ? prev
          : [...prev, { id: profile.id, user_id: profile.id, display_name: profile.display_name }]
      );
      setScanStatus(alreadyCheckedIn ? `${profile.display_name} is already checked in.` : 'Scan successful!');
      setTimeout(() => setScanning(false), 1500);

      if (!demo) return;
      try {
        const roster = await getRoster(id);
        setAttendees(roster.attendees);
        setJoinedUsers(roster.joined);
      } catch (e) {
        console.error('Error refreshing attendees:', e);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanStatus('Error processing QR code.');
    }
  };
  const processCodeRef = useRef(processCode);
  processCodeRef.current = processCode;

  useEffect(() => {
    if (!scanning) return;

    let scanner: QrScanner | null = null;
    const video = document.getElementById('qr-video') as HTMLVideoElement;

    const startScanner = async () => {
      setScanStatus('Initializing scanner...');

      let hasScanned = false;

      scanner = new QrScanner(
        video,
        result => {
          if (hasScanned) return;
          hasScanned = true;
          setScanStatus('Processing scanned data...');
          processCodeRef.current(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      try {
        await scanner.start();
        setScanStatus('Scanner is active. Please align the QR code.');
      } catch (e) {
        console.error('Could not start the camera:', e);
        setScanStatus('Camera unavailable.');
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
                  <span className="font-semibold">Description:</span> {generatedDescription?.trim() || (event.description ? (event.ai_generated === false ? event.description : `${event.description} ✨ AI GENERATED ✨`) : 'No description available.')}
                </p>
                <p className="text-[#E4DDC4]">
                  <span className="font-semibold">Created by:</span> @{event.profiles?.display_name ?? 'anonymous'}
                </p>
                {event.attendee_count !== undefined && (
                  <p className="text-[#E4DDC4]">
                    <span className="font-semibold">Going:</span> {event.attendee_count}
                  </p>
                )}
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
                          {demo && attendee.code && (
                            <p className="text-xs opacity-70">Check-in code: {attendee.code}</p>
                          )}
                        </div>
                        {attendee.rsvp_status && (
                          <div className="flex items-center gap-2 text-xs uppercase">
                            <span className="border border-[#E4DDC4] px-2 py-0.5">{attendee.rsvp_status}</span>
                            {attendee.checked_in && <span className="bg-[#E4DDC4] text-[#1F1F1F] px-2 py-0.5">Checked in</span>}
                          </div>
                        )}
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

            {isHost && (
              <div className="mb-6">
                <h2 className="text-2xl font-mono mb-2">Send Event Invite</h2>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                  <input
                    type="email"
                    placeholder="Recipient's email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    disabled={demo}
                    title={demo ? 'Sending email is disabled in demo mode' : undefined}
                    className="flex-1 px-4 py-2 text-[18px] font-mono border-[4px] border-[#E4DDC4] bg-[#1F1F1F] text-[#E4DDC4] focus:outline-none focus:ring-2 focus:ring-[#E4DDC4] placeholder-[#b8b8b8]"
                  />
                  <button
                    onClick={async () => {
                      setInviteStatus('sending');
                      setInviteError(null);
                      const { error } = await sendInvite(inviteEmail, event, `${window.location.origin}/event/${event.id}`);
                      if (error) {
                        setInviteStatus('error');
                        setInviteError(error);
                      } else {
                        setInviteStatus('sent');
                        setInviteEmail('');
                        setTimeout(() => setInviteStatus('idle'), 2000);
                      }
                    }}
                    disabled={demo || inviteStatus === 'sending' || !inviteEmail}
                    title={demo ? 'Sending email is disabled in demo mode' : undefined}
                    className="block border-[4px] text-[18px] font-mono text-center border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {inviteStatus === 'sending' ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
                {demo && <p className="mt-2 text-sm opacity-70">Email invites are turned off in demo mode.</p>}
                {inviteStatus === 'sent' && <p className="text-green-400 mt-2">Invite sent!</p>}
                {inviteStatus === 'error' && <p className="text-red-500 mt-2">{inviteError}</p>}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {isHost ? (
                  <button
                    onClick={() => setScanning(true)}
                    className="block w-full whitespace-nowrap border-[4px] text-[18px] font-mono text-center border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
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
                    className="block w-full border-[4px] text-[18px] font-mono text-center border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                  >
                    Video Call
                  </a>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button
                  onClick={() => {
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
                {isHost && (
                  <button
                    onClick={handleGenerateDescription}
                    disabled={demo && generating}
                    className="w-full border-[4px] text-[18px] font-mono border-[#E4DDC4] px-4 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {demo && generating ? 'Generating...' : 'Create AI Description'}
                  </button>
                )}
              </div>
              {isHost && (
                <div className="flex justify-center mt-4">
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
            {demo && (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!manualCode.trim()) return;
                  setScanStatus('Processing entered code...');
                  processCode(manualCode).then(() => setManualCode(''));
                }}
              >
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter a code, e.g. INV-1339"
                  aria-label="Check-in code"
                  className="flex-1 min-w-0 px-3 py-2 font-mono border-[3px] border-[#E4DDC4] bg-[#1F1F1F] text-[#E4DDC4] placeholder-[#b8b8b8] focus:outline-none"
                />
                <button
                  type="submit"
                  className="border-[3px] font-mono border-[#E4DDC4] px-3 py-2 uppercase hover:bg-[#E4DDC4] hover:text-[#1F1F1F] transition duration-300"
                >
                  Check in
                </button>
              </form>
            )}
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