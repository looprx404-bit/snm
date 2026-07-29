const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Your verified SheetDB API URL
const SHEETDB_URL = 'https://sheetdb.io/api/v1/fmp58vvvv41lc';

// API Endpoint to Submit a Petition Signature
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

  // Clean payload: matches Row 1 headers character-for-character
  const payload = {
    data: [
      {
        "name": String(name).trim(),
        "email": String(email).trim(),
        "ktuRoll": String(ktuRoll).trim().toUpperCase(),
        "busRoute": String(busRoute).trim(),
        "admissionYear": String(admissionYear).trim(),
        "freeBusDeclared": freeBusDeclared ? "YES" : "NO",
        "digitalSignature": String(digitalSignature).trim(),
        "additionalDetails": additionalDetails ? String(additionalDetails).trim() : "None"
      }
    ]
  };

  try {
    const response = await fetch(SHEETDB_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && !result.error) {
      res.status(201).json({ message: 'Signature recorded successfully in live petition!' });
    } else {
      console.error('SheetDB Error:', JSON.stringify(result));
      res.status(500).json({ error: 'Database rejected format. Please verify Row 1 headers in Google Sheet.' });
    }
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: 'Network error. Could not connect to database.' });
  }
});

// Endpoint to View Total Signature Count
app.get('/api/count', async (req, res) => {
  try {
    const response = await fetch(SHEETDB_URL);
    const data = await response.json();
    res.json({ count: Array.isArray(data) ? data.length : 0 });
  } catch (error) {
    res.json({ count: 'Active' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});