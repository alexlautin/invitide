import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get title and date from the query parameters
    const title = searchParams.get('title') || 'Event';
    const date = searchParams.get('date') || 'Date not specified';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1F1F1F',
            border: '10px solid #E4DDC4',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 50px',
            }}
          >
            <h1
              style={{
                fontSize: 70,
                fontFamily: '"VT323", monospace',
                color: '#E4DDC4',
                textTransform: 'uppercase',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              {title}
            </h1>
            <h2
              style={{
                fontSize: 40,
                fontFamily: '"JetBrains Mono", monospace',
                color: '#E4DDC4',
                marginTop: 0,
                textAlign: 'center',
              }}
            >
              {date}
            </h2>
            <p
              style={{
                fontSize: 30,
                fontFamily: '"JetBrains Mono", monospace',
                color: '#E4DDC4',
                marginTop: 40,
                padding: '10px 20px',
                border: '4px solid #E4DDC4',
              }}
            >
              INVITIDE.COM
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.log(`Error generating image: ${errorMessage}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}