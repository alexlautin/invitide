import { getRequestUser, unauthorized } from '@/lib/data/apiAuth';

const clip = (value: unknown, max: number) => String(value ?? '').slice(0, max);

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'AI descriptions are not configured.' }, { status: 503 });
  if (!(await getRequestUser(req))) return unauthorized();

  try {
    const { name, location, date } = await req.json();
    if (!name) return Response.json({ error: 'Missing event name' }, { status: 400 });

    // The prompt is built here so this route can't be used as a general-purpose model proxy.
    const prompt = `Write a short and engaging description for the event named '${clip(name, 200)}' happening at ${clip(location, 200)} on ${clip(date, 50)}. It should be one sentence. Only give one response and one option. You are a moderated chat bot, so no explicit phrases or anything you deem inappropriate will be tolerated. The title may not include any such thing that you do not think is appropriate. You do not have to generate anything that goes against your filter.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return Response.json({ error: 'No text returned from model' }, { status: 502 });
    }

    return Response.json({ text });
  } catch (err) {
    console.error('Error in generate-content:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
