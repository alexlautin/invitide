import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Use a more specific query to get all the data we need
  const { data: event } = await supabaseServer
    .from('events')
    .select('id, name, date, description, image_url, location')
    .eq('id', params.id)
    .single();

  if (!event) {
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

  // Create a more descriptive meta description
  const metaDescription = event.description 
    ? `${event.description} - Join us on ${formattedDate} at ${event.location}`
    : `Join us on ${formattedDate} at ${event.location}`;

  return {
    title: `${event.name} | Invitide`,
    description: metaDescription,
    openGraph: {
      title: event.name,
      description: metaDescription,
      url: `https://invitide.com/event/${params.id}`,
      images: [
        {
          url: event.image_url || 'https://invitide.com/og-event.png',
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
      images: [event.image_url || 'https://invitide.com/og-event.png'],
    },
  };
}