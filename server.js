const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database (creates petition.db automatically)
const db = new sqlite3.Database('./petition.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS signatures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        ktuRoll TEXT UNIQUE NOT NULL,
        busRoute TEXT NOT NULL,
        admissionYear INTEGER NOT NULL,
        freeBusDeclared BOOLEAN NOT NULL,
        digitalSignature TEXT NOT NULL,
        additionalDetails TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
});

// API Endpoint to Submit a Petition Signature
app.post('/api/sign', (req, res) => {
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

  // Basic Validation
  if (!name || !email || !ktuRoll || !busRoute || !admissionYear || !freeBusDeclared || !digitalSignature) {
    return res.status(400).json({ error: 'All required fields must be filled.' });
  }

  const query = `
    INSERT INTO signatures (name, email, ktuRoll, busRoute, admissionYear, freeBusDeclared, digitalSignature, additionalDetails)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, email, ktuRoll, busRoute, admissionYear, freeBusDeclared ? 1 : 0, digitalSignature, additionalDetails], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'This KTU Roll Number has already signed the petition.' });
      }
      return res.status(500).json({ error: 'Database error occurred.' });
    }
    res.status(201).json({ message: 'Signature recorded successfully!', id: this.lastID });
  });
});

// API Endpoint to View Total Signature Count
app.get('/api/count', (req, res) => {
  db.get('SELECT COUNT(*) AS count FROM signatures', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch count' });
    }
    res.json({ count: row.count });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});