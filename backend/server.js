import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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

// ==================== EMAIL TRIGGER API ====================

app.post('/api/send-quote', async (req, res) => {
  const { quoteId } = req.body;

  if (!quoteId) {
    return res.status(400).json({ error: 'Quote ID is required.' });
  }

  const quotes = await readData(QUOTES_FILE);
  const quoteIndex = quotes.findIndex(q => q.id === quoteId);

  if (quoteIndex === -1) {
    return res.status(404).json({ error: 'Quotation request not found.' });
  }

  const quote = quotes[quoteIndex];
  const forwarders = await readData(FORWARDERS_FILE);

  if (forwarders.length === 0) {
    return res.status(400).json({ error: 'No forwarders listed in the database. Please add forwarders first.' });
  }

  // Check if SMTP is mock or custom
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const senderEmail = process.env.SENDER_EMAIL || smtpUser;
  const senderName = process.env.SENDER_NAME || 'FreightBid Logistics';

  const isMockSmtp = 
    !smtpUser || 
    smtpUser.includes('your_email') || 
    smtpUser === '' || 
    !smtpPass || 
    smtpPass.includes('your_app_password');

  const emailsToSend = forwarders.map(f => ({
    name: f.name,
    company: f.company,
    email: f.email
  }));

  const results = [];
  let sentCount = 0;

  // Render the beautiful HTML Template
  const generateEmailHtml = (forwarderName, forwarderCompany) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Freight Quotation Request</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #FFF8F0;
          color: #4B3A2A;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.08);
          border: 1px solid #FFE5CC;
        }
        .header {
          background-color: #F97316;
          padding: 24px 30px;
          text-align: center;
        }
        .header h1 {
          color: #FFFFFF;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 16px;
          font-weight: 600;
          color: #1C1009;
          margin-bottom: 12px;
        }
        .intro {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
          color: #4B3A2A;
        }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #F97316;
          text-transform: uppercase;
          margin-bottom: 12px;
          letter-spacing: 1px;
          border-bottom: 1px solid #FFE5CC;
          padding-bottom: 4px;
        }
        .detail-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .detail-table td {
          padding: 8px 12px;
          font-size: 14px;
          border-bottom: 1px solid #FFF8F0;
        }
        .detail-table td.label {
          font-weight: 600;
          color: #1C1009;
          width: 40%;
          background-color: #FFFBF5;
        }
        .detail-table td.value {
          color: #4B3A2A;
        }
        .cta-box {
          background-color: #FFFBF5;
          border: 1px dashed #F97316;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }
        .cta-box h3 {
          margin-top: 0;
          color: #F97316;
          font-size: 15px;
          font-weight: 700;
        }
        .cta-box ol {
          margin: 0;
          padding-left: 20px;
          font-size: 14px;
          color: #4B3A2A;
          line-height: 1.6;
        }
        .cta-box li {
          margin-bottom: 6px;
        }
        .deadline {
          font-size: 14px;
          font-weight: 700;
          color: #1C1009;
          margin-top: 15px;
          background-color: #FFE5CC;
          padding: 8px 12px;
          border-radius: 6px;
          display: inline-block;
        }
        .footer {
          background-color: #FFFBF5;
          border-top: 1px solid #FFE5CC;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #8C7560;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FREIGHTBID LOGISTICS</h1>
        </div>
        <div class="content">
          <div class="greeting">Dear ${forwarderName} (${forwarderCompany}),</div>
          <div class="intro">
            We have registered a new shipment quotation request in our logistics network. We highly value your service quality and would like to cordially invite you to submit your most competitive freight bid.
          </div>
          
          <div class="section-title">Shipment Information</div>
          <table class="detail-table">
            <tr>
              <td class="label">Reference ID</td>
              <td class="value"><strong>${quote.referenceId}</strong></td>
            </tr>
            <tr>
              <td class="label">Origin</td>
              <td class="value">${quote.origin}</td>
            </tr>
            <tr>
              <td class="label">Destination</td>
              <td class="value">${quote.destination}</td>
            </tr>
            <tr>
              <td class="label">Cargo Type</td>
              <td class="value">${quote.cargoType}</td>
            </tr>
            <tr>
              <td class="label">Weight</td>
              <td class="value">${quote.weight} kg</td>
            </tr>
            <tr>
              <td class="label">Dimensions (L x W x H)</td>
              <td class="value">${quote.dimensions}</td>
            </tr>
            <tr>
              <td class="label">Declared Value</td>
              <td class="value">${quote.declaredValue ? `$${quote.declaredValue.toLocaleString()}` : 'N/A'}</td>
            </tr>
            <tr>
              <td class="label">Incoterms</td>
              <td class="value">${quote.incoterms}</td>
            </tr>
            <tr>
              <td class="label">Mode of Shipment</td>
              <td class="value">${quote.mode}</td>
            </tr>
            <tr>
              <td class="label">Expected Readiness</td>
              <td class="value">${quote.readyDate}</td>
            </tr>
            ${quote.specialInstructions ? `
            <tr>
              <td class="label">Special Instructions</td>
              <td class="value">${quote.specialInstructions}</td>
            </tr>` : ''}
          </table>

          <div class="cta-box">
            <h3>Bidding Submission Instructions</h3>
            <p style="font-size: 13px; margin-top: 0; color: #4B3A2A;">Please reply directly to this email with the following details to place your bid:</p>
            <ol>
              <li><strong>Your Quoted Price:</strong> Total all-inclusive rate (state currency: USD/INR)</li>
              <li><strong>Estimated Transit Time (ETD / ETA):</strong> Total transit duration</li>
              <li><strong>Terms & Conditions:</strong> Any additional surcharges, exclusions, or carrier remarks</li>
            </ol>
            <div class="deadline">
              Submission Deadline: ${quote.deadline ? new Date(quote.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'ASAP'}
            </div>
          </div>
        </div>
        <div class="footer">
          This is an automated quotation inquiry generated via <strong>FreightBid Logistics Platform</strong>.<br/>
          &copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.<br/>
          Contact: ${senderEmail}
        </div>
      </div>
    </body>
    </html>
    `;
  };

  if (isMockSmtp) {
    console.log('\n======================================================');
    console.log(`[SMTP MOCK MODE] Sending quote request ${quote.referenceId} to ${forwarders.length} forwarders.`);
    console.log('======================================================');
    
    for (const f of forwarders) {
      console.log(`\n--> Email Draft for: ${f.name} <${f.email}>`);
      console.log(`Subject: Freight Quotation Request - ${quote.referenceId} | ${quote.origin} to ${quote.destination}`);
      console.log('Email Body Generated Successfully.');
      
      results.push({
        email: f.email,
        name: f.name,
        company: f.company,
        status: 'simulated_success'
      });
      sentCount++;
    }
    
    console.log('\n======================================================\n');
  } else {
    // Real SMTP setup
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Verify connection config
      await transporter.verify();

      for (const f of forwarders) {
        const mailOptions = {
          from: `"${senderName}" <${senderEmail}>`,
          to: f.email,
          subject: `Freight Quotation Request – ${quote.referenceId} | ${quote.origin} to ${quote.destination}`,
          html: generateEmailHtml(f.name, f.company)
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          results.push({
            email: f.email,
            name: f.name,
            company: f.company,
            status: 'success',
            messageId: info.messageId
          });
          sentCount++;
        } catch (mailError) {
          console.error(`Failed to send email to ${f.email}:`, mailError);
          results.push({
            email: f.email,
            name: f.name,
            company: f.company,
            status: 'failed',
            error: mailError.message
          });
        }
      }
    } catch (smtpError) {
      console.error('SMTP Connection setup failed, falling back to simulated send:', smtpError);
      return res.status(500).json({ 
        error: 'Failed to configure SMTP connection.', 
        details: smtpError.message 
      });
    }
  }

  // Update quote status in DB
  quote.status = 'Sent';
  quote.forwardersEmailedCount = sentCount;
  await writeData(QUOTES_FILE, quotes);

  res.json({
    message: isMockSmtp 
      ? `Simulated email send-out complete. Saved draft copies to backend console.`
      : `Successfully sent quotation requests to ${sentCount} forwarders!`,
    isMock: isMockSmtp,
    sentCount,
    totalCount: forwarders.length,
    results
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`FreightBid Express Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.SMTP_USER && !process.env.SMTP_USER.includes('your_email') ? 'REAL SMTP' : 'MOCK SMTP'}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
