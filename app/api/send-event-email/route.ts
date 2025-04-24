import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not set in environment variables.' }), { status: 500 });
  }
  try {
    const { to, event } = await req.json();
    if (!to || !event) {
      console.error('Missing email or event data', { to, event });
      return new Response(JSON.stringify({ error: 'Missing email or event data', to, event }), { status: 400 });
    }

    const emailBody = `You are invited to the event: ${event.name}\n\nDate: ${event.date}\nLocation: ${event.location}\n\nEvent Link: ${event.link}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@sevenworks.tech', // Use your verified domain
        to,
        subject: `You're invited: ${event.name}`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: errorText }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: unknown) {
    console.error('Internal error in send-event-email:', err);
    return new Response(JSON.stringify({ error: 'Internal error', detail: String(err), stack: err instanceof Error ? err.stack : undefined }), { status: 500 });
  }
}
