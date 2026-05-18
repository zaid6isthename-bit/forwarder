# FreightBid 🚚

**A premium full-stack logistics quotation dispatch platform.**

FreightBid lets shipment owners manage a directory of freight forwarders and instantly broadcast professional HTML email RFQ (Request for Quotation) campaigns to every agency in their network with a single click.

---

## 🗂️ Project Structure

```
forwarder/
├── backend/            # Node.js + Express + Nodemailer API server
│   ├── data/
│   │   ├── forwarders.json   # Forwarder CRM database (JSON file store)
│   │   └── quotes.json       # Quotation history database
│   ├── server.js             # Main Express server with all routes
│   ├── .env                  # ⚠️ Your SMTP credentials (gitignored)
│   └── .env.example          # Copy this to .env and fill in your details
│
└── frontend/           # React + Tailwind CSS + Vite SPA
    └── src/
        └── App.jsx     # Full application (Dashboard, CRM, Quote Wizard, History)
```

---

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev       # Starts Express server on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## ⚙️ Configuration (SMTP Email)

Copy `.env.example` to `.env` in the `backend/` folder and fill in your credentials:

```env
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password        # Use a Gmail App Password, not your login password
SENDER_NAME=FreightBid Logistics
SENDER_EMAIL=your_email@gmail.com
```

> **Gmail Setup:** Go to `myaccount.google.com` → Security → 2-Step Verification → **App passwords**.  
> Generate an app password for "Mail" and paste it as `SMTP_PASS`.

### 📬 Mock / Sandbox Mode

If `SMTP_USER` is left as `your_email@gmail.com` (unchanged), the server automatically switches to **Mock Mode**:
- Emails are NOT sent to real addresses
- A professional preview of each email is printed to the **backend terminal console**
- The quotation is still saved and marked as `Sent` in the UI

---

## 📄 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/forwarders` | List all forwarders |
| `POST` | `/api/forwarders` | Add a new forwarder |
| `PUT` | `/api/forwarders/:id` | Update a forwarder |
| `DELETE` | `/api/forwarders/:id` | Remove a forwarder |
| `GET` | `/api/quotes` | List all quotation history |
| `POST` | `/api/quotes` | Save a new quotation |
| `POST` | `/api/send-quote` | Trigger email dispatch to all forwarders |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary Orange | `#F97316` |
| Background Cream | `#FFF8F0` |
| Card Surface | `#FFFFFF` |
| Heading Text | `#1C1009` |
| Body Text | `#4B3A2A` |
| Accent Border | `#FFE5CC` |
| Font | Inter + Poppins |

---

## 🌐 Deployment

- **Frontend → Vercel**: `cd frontend && npm run build` → deploy `dist/` folder  
- **Backend → Render**: Deploy `backend/` as a Node.js web service, set environment variables in the Render dashboard

> Remember to update `API_BASE` in `App.jsx` to your production Render URL before building for deployment.
