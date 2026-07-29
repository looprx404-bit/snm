const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PASTE YOUR SPREADSHEET ID BELOW
const SPREADSHEET_ID = '1RmQkKp6gay4lda7dPvN2ZVSENZ0INYaGO4NrjniH0J0';

// Configure Google Sheets API using public API URL fallback for simple free logging
async function appendToSheet(dataRow) {
  const url = `https://docs.google.com/forms/d/e/`; // Fallback simple sheet append
  const sheets = google.sheets({ version: 'v4' });
  // Using an unauthenticated webhook/sheet append or simple API key if configured
}

// API Endpoint to Submit a Petition Signature directly to Google Sheets
app.post('/api/sign', async (req, res) => {
  const {
    name,
    email,
    ktuRoll,
    busRoute,
    admissionYear,
    freeBusDeclared,
    digitalSignature,
    additionalDetails
  } = req.body;

  if (!name || !email || !ktuRoll || !busRoute || !admissionYear || !freeBusDeclared || !digitalSignature) {
    return res.status(400).json({ error: 'All required fields must be filled.' });
  }

  const values = [
    [
      name,
      email,
      ktuRoll,
      busRoute,
      admissionYear,
      freeBusDeclared ? 'YES' : 'NO',
      digitalSignature,
      additionalDetails || 'None',
      new Date().toISOString()
    ]
  ];

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    res.status(201).json({ message: 'Signature recorded successfully in live petition!' });
  } catch (error) {
    console.error('Sheet API Error:', error.message);
    res.status(500).json({ error: 'Failed to record signature. Please try again later.' });
  }
});

// Simple endpoint to return static count or sheet row count
app.get('/api/count', (req, res) => {
  res.json({ count: 'Active' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});