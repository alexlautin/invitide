import { config } from 'dotenv';
config();

interface PromptRequest {
    prompt: string;
}

interface PromptResponse {
    candidates: Array<{ output: string }>;
}

const apiKey = process.env.GOOGLE_API_KEY;

export async function POST(req: Request): Promise<Response> {
    const { prompt }: PromptRequest = await req.json();

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: { text: prompt },
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        return new Response(JSON.stringify({ error: 'API request failed', detail: errorText }), { status: response.status });
    }

    const data: PromptResponse = await response.json();
    return new Response(JSON.stringify(data), { status: response.status });
}