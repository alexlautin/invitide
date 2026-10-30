import { fetchEventForMetadata } from '@/lib/data/server';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (!id) {
    return {
      title: 'Invalid Event | Invitide',
      description: 'No event ID provided.',
    };
  }

  if (id.startsWith('demo-')) {
    return { title: 'Demo Event', description: 'A sample event in the Invitide demo.' };
  }

  const event = await fetchEventForMetadata(id);

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