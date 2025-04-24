import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not set in environment variables.' }), { status: 500 });
  }
  try {
    const { to, event } = await req.json();
    if (!to || !event || !event.name || !event.date || !event.location || !event.link) {
      console.error('Missing required event fields', { to, event });
      return new Response(
        JSON.stringify({ error: 'Missing required event fields', to, event }),
        { status: 400 }
      );
    }

    // Parse event.date and add 2 hours for end time
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startStr}/${endStr}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(event.link)}`;

    const emailBody = `You are invited to the event: ${event.name}\n\nDate: ${event.date}\nLocation: ${event.location}\n\nEvent Link: ${event.link}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 12px; color: #222; max-width: 480px; margin: 0 auto; position: relative;">
        <img src="https://invitide.vercel.app/_next/image?url=%2Flogo.png&w=640&q=75" alt="Invitide Logo" style="position: absolute; top: 16px; right: 16px; width: 48px; height: 48px; border-radius: 8px; background: #fff; border: 2px solid #E4DDC4; box-shadow: 0 2px 8px #0002;" />
        <h2 style="color: #2d3748;">You're Invited: ${event.name}</h2>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p style="margin: 24px 0;">
          <a href="${event.link}" style="display: inline-block; background: #E4DDC4; color: #1F1F1F; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Event</a>
        </p>
        <p style="margin: 16px 0;">
          <a href="${googleCalendarUrl}" style="display: inline-block; background: #4285F4; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Add to Google Calendar</a>
        </p>
        <p style="font-size: 14px; color: #888;">Sent via Invitide</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${event.name} via Invitide <Invitide@sevenworks.tech>`,
        to,
        subject: `You're invited: ${event.name}`,
        text: emailBody,
        html: emailHtml,
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
