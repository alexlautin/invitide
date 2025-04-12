import { NextResponse } from 'next/server';

export async function GET() {
  const uniqueRoomName = `event-room-${Date.now()}`;
  const jitsiApiKey = process.env.JITSI_API_KEY;

  if (!jitsiApiKey) {
    return NextResponse.json({ error: 'Jitsi API key is not configured.' }, { status: 500 });
  }

  const jitsiMeetingLink = `https://8x8.vc/${jitsiApiKey}/${uniqueRoomName}`;

  return NextResponse.json({ meetingLink: jitsiMeetingLink });
}