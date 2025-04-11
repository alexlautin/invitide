import { serve } from "std/server";
import { PKPass } from "passkit-generator";

const logoPath = "/logo.png";
const iconPath = "/icon.png";

serve(async (req) => {
  let eventData;
  // If GET, use default event data for testing; otherwise, expect a POST with JSON data.
  if (req.method === "GET") {
    eventData = { 
      eventName: "Test Event", 
      eventDate: "2025-05-01", 
      eventLocation: "Test Location" 
    };
  } else {
    eventData = await req.json();
  }

  const { eventName, eventDate, eventLocation } = eventData;
  if (!eventName || !eventDate || !eventLocation) {
    return new Response("Missing event data", { status: 400 });
  }

  try {
    // Create a new pass using PKPass
    const pass = new PKPass({
      passTypeIdentifier: "pass.com.example.event", // Replace with your actual pass type identifier
      teamIdentifier: "YOUR_TEAM_ID",                // Replace with your actual team identifier
      organizationName: "Event Organization",
      serialNumber: "12345",                          // Unique serial number for the pass
      description: "Event Pass",
    });

    // Add event details to the pass as fields
    pass.headerFields = [
      { key: "eventName", label: "Event", value: eventName }
    ];
    pass.secondaryFields = [
      { key: "eventDate", label: "Date", value: eventDate }
    ];
    pass.auxiliaryFields = [
      { key: "eventLocation", label: "Location", value: eventLocation }
    ];

    // Set logo and icon images
    pass.setLogo(logoPath);
    pass.setIcon(iconPath);

    // Customize appearance
    pass.setBackgroundColor("#000000");
    pass.setForegroundColor("#FFFFFF");

    // Generate the .pkpass file
    const pkpassBuffer = await pass.generate();

    return new Response(pkpassBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="event-pass.pkpass"',
      },
    });
  } catch (err: any) {
    console.error("Error generating pass:", err);
    return new Response(`Error generating pass: ${err.message}`, { status: 500 });
  }
});