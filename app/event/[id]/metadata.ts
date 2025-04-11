import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';

// Create a server-side supabase client for the metadata function
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Fetch event data from Supabase
  const { data: event } = await supabaseServer
    .from('events')
    .select('name, date, description, location')
    .eq('id', params.id)
    .single();

  if (!event) {
    return {
      title: 'Event Not Found | INVITIDE',
      description: 'The requested event could not be found.',
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
    title: `${event.name} | INVITIDE`,
    description: event.description || `Join us at ${event.location} on ${formattedDate}`,
    openGraph: {
      title: event.name,
      description: event.description || `Join us at ${event.location} on ${formattedDate}`,
      type: 'website',
      siteName: 'INVITIDE',
      images: [{
        url: `/api/og?title=${encodeURIComponent(event.name)}&date=${encodeURIComponent(formattedDate)}`,
        width: 1200,
        height: 630,
        alt: event.name,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description: event.description || `Join us at ${event.location} on ${formattedDate}`,
      images: [`/api/og?title=${encodeURIComponent(event.name)}&date=${encodeURIComponent(formattedDate)}`],
    },
  };
}