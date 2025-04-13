export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      return new Response(JSON.stringify({ error: 'No text returned from model' }), { status: 500 });
    }

    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error', detail: String(err) }), { status: 500 });
  }
}