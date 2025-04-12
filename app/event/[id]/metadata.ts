import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (!id) {
    return {
      title: 'Invalid Event | Invitide',
      description: 'No event ID provided.',
    };
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, date, location')
    .eq('id', id)
    .single();

  if (error || !event) {
    return {
      title: 'Event Not Found | Invitide',
      description: 'Sorry, this event could not be found.',
    };
  }

  const formattedDate = new Date(event.date).toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const metaDescription = `Join us on ${formattedDate} at ${event.location}`;

  return {
    title: `${event.name}`,
    description: metaDescription,
    openGraph: {
      title: event.name,
      description: metaDescription,
      url: `https://invitide.com/event/${id}`,
      images: [
        {
          url: 'https://invitide.com/og-event.png',
          width: 1200,
          height: 630,
          alt: event.name,
        },
      ],
      type: 'website',
      siteName: 'Invitide',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description: metaDescription,
      images: ['https://invitide.com/og-event.png'],
    },
  };
}