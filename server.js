const express = require('express');
const { PKPass } = require('passkit-generator'); // Correct import: using PKPass
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3001;

// Load environment variables from .env file
require('dotenv').config();

// Enable CORS for cross-origin requests
app.use(cors());
// Parse JSON bodies in POST requests
app.use(express.json());

// Fix the issue with fetching the logoPath and iconPath by defining their absolute paths
const logoPath = path.join(__dirname, 'assets', 'logo.png');
const iconPath = path.join(__dirname, 'assets', 'image.png');

// Route to generate the pass
app.post('/generate-pass', (req, res) => {
  console.log('Received request:', req.body);

  // Validate request body contains the required event details
  const { eventName, eventDate, eventLocation } = req.body;
  if (!eventName || !eventDate || !eventLocation) {
    return res.status(400).send('Missing event data');
  }

  // Ensure all required icon files are included
  const requiredIcons = ['icon.png', 'icon@2x.png'];
  for (const icon of requiredIcons) {
    const iconPath = path.join(__dirname, 'assets', icon);
    if (!fs.existsSync(iconPath)) {
      console.error(`Missing required icon file: ${icon}`);
      return res.status(500).send(`Missing required icon file: ${icon}`);
    }
  }

  // Ensure the pass object is properly initialized
  const pass = new PKPass({
    passTypeIdentifier: 'pass.com.example.event', // Replace with your actual pass type identifier
    teamIdentifier: 'YOUR_TEAM_ID',              // Replace with your actual team identifier
    organizationName: 'Event Organization',
    serialNumber: '12345',                       // Unique serial number for the pass
    description: 'Event Pass',
    signerKeyPassphrase: process.env.SIGNER_KEY_PASSPHRASE, // Ensure this is set in your environment variables
  });

  // Ensure the pass type is set correctly
  pass.type = 'eventTicket';

  pass.headerFields = [
    { key: 'eventName', label: 'Event', value: eventName },
  ];
  pass.primaryFields = [
    { key: 'someField', label: 'Label', value: 'Value' },
  ];
  pass.secondaryFields = [
    { key: 'eventDate', label: 'Date', value: eventDate },
  ];
  pass.auxiliaryFields = [
    { key: 'eventLocation', label: 'Location', value: eventLocation },
  ];
  pass.backFields = [
    { key: 'notes', label: 'Notes', value: 'Additional info' },
  ];

  // Add images:
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    pass.images.logo = logoBuffer;
  }
  if (fs.existsSync(iconPath)) {
    const iconBuffer = fs.readFileSync(iconPath);
    pass.images.icon = iconBuffer;
  }

  // Set colors:
  pass.backgroundColor = '#000000';
  pass.foregroundColor = '#FFFFFF';
  pass.labelColor = '#FFFFFF';

  // Generate the pass
  pass.getAsBuffer()
    .then((pkpassBuffer) => {
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="event-pass.pkpass"'
      );
      res.send(pkpassBuffer);
    })
    .catch((err) => {
      console.error('Error generating pass:', err);
      res.status(500).send(`Error generating pass: ${err.message}`);
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});