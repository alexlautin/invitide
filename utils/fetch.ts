    const fetchEventAttendees = async (eventId: string, userId: string) => {
      const response = await fetch(
        `https://hzvruzrcqdlzrfmgzszi.supabase.co/rest/v1/event_attendees?select=*&event_id=eq.${eventId}&user_id=eq.${userId}`,
        {
          method: 'GET',
          headers: {
            'apikey': process.env.SUPABASE_API_KEY || '',
            'Authorization': `Bearer ${process.env.SUPABASE_API_KEY || ''}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching event attendees: ${response.statusText}`);
      }

      return response.json();
    };