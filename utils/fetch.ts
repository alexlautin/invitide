const supabaseApiKey = process.env.SUPABASE_API_KEY || '';

const fetchEventAttendees = async (eventId: string, userId: string) => {
    console.log('Fetching event attendees with:', { eventId, userId }); // Log query parameters

    try {
        const response = await fetch(
            `https://hzvruzrcqdlzrfmgzszi.supabase.co/rest/v1/event_attendees?select=*&event_id=eq.${eventId}&user_id=eq.${userId}`,
            {
                method: 'GET',
                headers: {
                    'apikey': process.env.SUPABASE_API_KEY || '',
                    'Authorization': `Bearer ${process.env.SUPABASE_API_KEY || ''}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error(`Error fetching event attendees: ${response.status} - ${response.statusText}`);
            const errorDetails = await response.text();
            console.error('Error details:', errorDetails);
            throw new Error(`Error fetching event attendees: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching event attendees:', error);
        throw error;
    }
};