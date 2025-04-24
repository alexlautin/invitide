import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get('data');
  const filename = searchParams.get('filename') || 'event.ics';

  if (!data) {
    return new Response('Missing data', { status: 400 });
  }

  try {
    const icsBuffer = Buffer.from(data, 'base64');
    return new Response(icsBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.ics"`,
      },
    });
  } catch {
    return new Response('Invalid data', { status: 400 });
  }
}
