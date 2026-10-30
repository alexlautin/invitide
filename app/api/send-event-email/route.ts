import { NextRequest } from 'next/server';
import { getRequestUser, unauthorized } from '@/lib/data/apiAuth';

const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(req: NextRequest) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return Response.json({ error: 'Email invites are not configured.' }, { status: 503 });
  }
  const auth = await getRequestUser(req);
  if (!auth) return unauthorized();

  try {
    const { to, eventId } = await req.json();
    if (typeof to !== 'string' || to.length > 254 || !EMAIL_RE.test(to) || typeof eventId !== 'string') {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    // Event details come from the database, not the request, so the email content can't be forged.
    const { data: event } = await auth.supabase
      .from('events')
      .select('id, name, date, location')
      .eq('id', eventId)
      .single();
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const link = `${req.nextUrl.origin}/event/${encodeURIComponent(event.id)}`;

    // Parse event.date and add 2 hours for end time
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${startStr}/${endStr}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(link)}`;

    const name = escapeHtml(event.name);
    const date = escapeHtml(String(event.date));
    const location = escapeHtml(event.location);

    const emailBody = `You are invited to the event: ${event.name}\n\nDate: ${event.date}\nLocation: ${event.location}\n\nEvent Link: ${link}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 12px; color: #222; max-width: 480px; margin: 0 auto; position: relative;">
        <img src="https://invitide.vercel.app/_next/image?url=%2Flogo.png&w=640&q=75" alt="Invitide Logo" style="position: absolute; top: 16px; right: 16px; width: 48px; height: 48px; border-radius: 8px; background: #fff; border: 2px solid #E4DDC4; box-shadow: 0 2px 8px #0002;" />
        <h2 style="color: #2d3748;">You're Invited: ${name}</h2>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p style="margin: 24px 0;">
          <a href="${escapeHtml(link)}" style="display: inline-block; background: #E4DDC4; color: #1F1F1F; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Event</a>
        </p>
        <p style="margin: 16px 0;">
          <a href="${escapeHtml(googleCalendarUrl)}" style="display: inline-block; background: #4285F4; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Add to Google Calendar</a>
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
        from: `${event.name.replace(/[<>"\r\n]/g, '').slice(0, 60)} via Invitide <Invitide@sevenworks.tech>`,
        to,
        subject: `You're invited: ${event.name.replace(/[\r\n]/g, ' ')}`,
        text: emailBody,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      console.error('Resend API error:', await response.text());
      return Response.json({ error: 'Failed to send email' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    console.error('Internal error in send-event-email:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
