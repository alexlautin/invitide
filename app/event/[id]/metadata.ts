import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: event } = await supabaseServer
    .from('events')
    .select('name, date, description, image_url')
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

  return {
    title: `${event.name} | Invitide`,
    description: event.description || `Join us on ${formattedDate}`,
    openGraph: {
      title: event.name,
      description: event.description || `Join us on ${formattedDate}`,
      url: `https://invitide.com/event/${params.id}`,
      images: [
        {
          url: event.image_url || 'https://invitide.com/og-event.png',
          width: 1200,
          height: 630,
          alt: event.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description: event.description || `Join us on ${formattedDate}`,
      images: [event.image_url || 'https://invitide.com/og-event.png'],
    },
  };
}