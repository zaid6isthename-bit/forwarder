import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { mailService } from './src/server/email/mailService.js';
import { emailQueue } from './src/server/email/emailQueue.js';
import { getLogsByRfq } from './src/server/email/emailLogger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup path helpers for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const FORWARDERS_FILE = path.join(DATA_DIR, 'forwarders.json');
const QUOTES_FILE = path.join(DATA_DIR, 'quotes.json');

// Helper to ensure files exist
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    try {
      await fs.access(FORWARDERS_FILE);
    } catch {
      await fs.writeFile(FORWARDERS_FILE, JSON.stringify([], null, 2));
      console.log('Created empty forwarders database.');
    }

    try {
      await fs.access(QUOTES_FILE);
    } catch {
      await fs.writeFile(QUOTES_FILE, JSON.stringify([], null, 2));
      console.log('Created empty quotes database.');
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

// Read data helper
async function readData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Write data helper
async function writeData(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

// Initialize storage folders & files
await initStorage();
await emailQueue.resumePendingJobs();

// ==================== FORWARDERS API ====================

// Get all forwarders
app.get('/api/forwarders', async (req, res) => {
  const forwarders = await readData(FORWARDERS_FILE);
  res.json(forwarders);
});

// Add a new forwarder
app.post('/api/forwarders', async (req, res) => {
  const { name, company, email, phone, notes } = req.body;
  
  if (!name || !company || !email) {
    return res.status(400).json({ error: 'Name, Company, and Email are required.' });
  }

  const forwarders = await readData(FORWARDERS_FILE);
  
  const newForwarder = {
    id: `fwd-${Date.now()}`,
    name,
    company,
    email,
    phone: phone || '',
    notes: notes || ''
  };

  forwarders.push(newForwarder);
  const success = await writeData(FORWARDERS_FILE, forwarders);

  if (success) {
    res.status(201).json(newForwarder);
  } else {
    res.status(500).json({ error: 'Failed to write to database.' });
  }
});

// Update a forwarder
app.put('/api/forwarders/:id', async (req, res) => {
  const { id } = req.params;
  const { name, company, email, phone, notes } = req.body;

  if (!name || !company || !email) {
    return res.status(400).json({ error: 'Name, Company, and Email are required.' });
  }

  const forwarders = await readData(FORWARDERS_FILE);
  const index = forwarders.findIndex(f => f.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Forwarder not found.' });
  }

  forwarders[index] = {
    ...forwarders[index],
    name,
    company,
    email,
    phone: phone || '',
    notes: notes || ''
  };

  const success = await writeData(FORWARDERS_FILE, forwarders);

  if (success) {
    res.json(forwarders[index]);
  } else {
    res.status(500).json({ error: 'Failed to update database.' });
  }
});

// Delete a forwarder
app.delete('/api/forwarders/:id', async (req, res) => {
  const { id } = req.params;
  
  const forwarders = await readData(FORWARDERS_FILE);
  const index = forwarders.findIndex(f => f.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Forwarder not found.' });
  }

  const deleted = forwarders.splice(index, 1);
  const success = await writeData(FORWARDERS_FILE, forwarders);

  if (success) {
    res.json({ message: 'Forwarder deleted successfully.', deleted: deleted[0] });
  } else {
    res.status(500).json({ error: 'Failed to update database.' });
  }
});

// ==================== QUOTES API ====================

// Get all quotes
app.get('/api/quotes', async (req, res) => {
  const quotes = await readData(QUOTES_FILE);
  // Sort quotes by date descending
  quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(quotes);
});

// Create a quotation request (saves to DB and defaults status to Pending)
app.post('/api/quotes', async (req, res) => {
  const quoteData = req.body;

  if (!quoteData.origin || !quoteData.destination || !quoteData.cargoType) {
    return res.status(400).json({ error: 'Origin, Destination, and Cargo Type are required.' });
  }

  const quotes = await readData(QUOTES_FILE);

  // Generate beautiful unique Shipment Ref ID
  const today = new Date();
  const dateStr = today.getFullYear() + 
                  String(today.getMonth() + 1).padStart(2, '0') + 
                  String(today.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const referenceId = quoteData.referenceId || `FB-${dateStr}-${rand}`;

  const newQuote = {
    id: `quote-${Date.now()}`,
    referenceId,
    origin: quoteData.origin,
    destination: quoteData.destination,
    cargoType: quoteData.cargoType,
    weight: Number(quoteData.weight) || 0,
    dimensions: quoteData.dimensions || 'N/A',
    declaredValue: Number(quoteData.declaredValue) || 0,
    incoterms: quoteData.incoterms || 'EXW',
    mode: quoteData.mode || 'Air',
    readyDate: quoteData.readyDate || '',
    specialInstructions: quoteData.specialInstructions || '',
    deadline: quoteData.deadline || '',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    forwardersEmailedCount: 0
  };

  quotes.push(newQuote);
  const success = await writeData(QUOTES_FILE, quotes);

  if (success) {
    res.status(201).json(newQuote);
  } else {
    res.status(500).json({ error: 'Failed to save quotation.' });
  }
});

// ==================== EMAIL TRIGGER & LOGS API ====================

// Helper to process campaign
async function initiateCampaign(quote, frontendForwarders, res) {
  if (!quote) {
    return res.status(400).json({ error: 'Quote data is required.' });
  }

  // 1. Save or sync RFQ to backend database
  const quotes = await readData(QUOTES_FILE);
  const existingQuoteIndex = quotes.findIndex(q => q.referenceId === quote.referenceId || q.id === quote.id);
  
  const quoteToSave = {
    id: quote.id || `quote-${Date.now()}`,
    referenceId: quote.referenceId,
    origin: quote.origin,
    destination: quote.destination,
    cargoType: quote.cargoType,
    weight: Number(quote.weight) || 0,
    dimensions: quote.dimensions || 'N/A',
    declaredValue: Number(quote.declaredValue) || 0,
    incoterms: quote.incoterms || 'EXW',
    mode: quote.mode || 'Air',
    readyDate: quote.readyDate || '',
    specialInstructions: quote.specialInstructions || '',
    deadline: quote.deadline || '',
    status: 'Sent',
    createdAt: quote.createdAt || new Date().toISOString(),
    forwardersEmailedCount: 0
  };

  if (existingQuoteIndex === -1) {
    quotes.push(quoteToSave);
  } else {
    quotes[existingQuoteIndex] = {
      ...quotes[existingQuoteIndex],
      ...quoteToSave
    };
  }
  await writeData(QUOTES_FILE, quotes);

  // 2. Fetch all forwarders from backend database (CRM)
  let forwarders = await readData(FORWARDERS_FILE);
  if (forwarders.length === 0) {
    console.log('[API] Backend forwarders CRM is empty. Using forwarders list passed from frontend.');
    forwarders = frontendForwarders || [];
  }

  if (forwarders.length === 0) {
    return res.status(400).json({ error: 'No forwarders available in CRM. Please add forwarders first.' });
  }

  // 3. Queue emails asynchronously using the reusable mailService
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const isMock = !smtpUser || smtpUser.includes('your_email') || !smtpPass || smtpPass.includes('your_app_password');

  const recipients = forwarders.map(f => ({
    name: f.name,
    email: f.email,
    company: f.company
  }));

  try {
    const result = await mailService.sendRFQEmails(quoteToSave, recipients);

    // Update emailed count in database
    quoteToSave.forwardersEmailedCount = recipients.length;
    if (existingQuoteIndex === -1) {
      quotes[quotes.length - 1] = quoteToSave;
    } else {
      quotes[existingQuoteIndex] = quoteToSave;
    }
    await writeData(QUOTES_FILE, quotes);

    return res.json({
      message: isMock 
        ? `Simulated email send-out complete. Saved draft copies to backend console.`
        : `Successfully queued quotation requests to ${recipients.length} forwarders!`,
      isMock,
      sentCount: recipients.length,
      totalCount: forwarders.length,
      jobs: result.jobs
    });

  } catch (error) {
    console.error('[API] Error initiating email campaign:', error);
    return res.status(500).json({ error: 'Failed to initiate email campaign.', details: error.message });
  }
}

// POST endpoint matching frontend request
app.post('/api/send-email', async (req, res) => {
  const { quote, forwarders } = req.body;
  await initiateCampaign(quote, forwarders, res);
});

// POST endpoint for trigger by quote ID
app.post('/api/send-quote', async (req, res) => {
  const { quoteId } = req.body;

  if (!quoteId) {
    return res.status(400).json({ error: 'Quote ID is required.' });
  }

  const quotes = await readData(QUOTES_FILE);
  const quote = quotes.find(q => q.id === quoteId || q.referenceId === quoteId);

  if (!quote) {
    return res.status(404).json({ error: 'Quotation request not found.' });
  }

  const forwarders = await readData(FORWARDERS_FILE);
  await initiateCampaign(quote, forwarders, res);
});

// GET endpoint to query email send status in real-time
app.get('/api/email-logs', async (req, res) => {
  const { rfq_id } = req.query;

  if (!rfq_id) {
    return res.status(400).json({ error: 'rfq_id parameter is required.' });
  }

  try {
    const logs = await getLogsByRfq(rfq_id);
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve email logs.', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`FreightBid Express Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.SMTP_USER && !process.env.SMTP_USER.includes('your_email') ? 'REAL SMTP' : 'MOCK SMTP'}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
