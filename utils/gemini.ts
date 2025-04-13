const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=' + GEMINI_API_KEY;

/**
 * Generate an event image using the Gemini API.
 * @param {string} prompt - The description of the image to generate.
 * @returns {Promise<string>} - The URL of the generated image.
 */
interface GeminiRequestBody {
  contents: { parts: { text: string }[] }[];
  generationConfig: { responseModalities: string[] };
}

interface GeminiResponseData {
  candidates?: { content: { parts: { inlineData: { data: string } }[] } }[];
}

export async function generateEventImage(prompt: string): Promise<string> {
  try {
    const response = await fetch(GEMINI_API_URL, {
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
        generationConfig: {
          responseModalities: ['Image'],
        },
      } as GeminiRequestBody),
    });

    const data: GeminiResponseData = await response.json();

    const base64Image = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Image) {
      return `data:image/png;base64,${base64Image}`;
    } else {
      throw new Error('Failed to generate image: No base64 data returned.');
    }
  } catch (error) {
    console.error('Error generating event image:', error);
    throw error;
  }
}