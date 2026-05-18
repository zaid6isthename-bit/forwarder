// ── localStorage keys ─────────────────────────────────────────
const LS_FWD    = 'fb_forwarders';
const LS_QUOTES = 'fb_quotes';

// ── Seed data (loaded once on first launch) ───────────────────
const SEED_FORWARDERS = [
  { id: 'fwd-1', name: 'Alex Mercer',    company: 'Global Cargo Solutions',  email: 'alex.mercer@globalcargo.example.com',      phone: '+1-555-0198',       notes: 'Excellent air freight rates. Quick responses.' },
  { id: 'fwd-2', name: 'Sarah Connor',   company: 'Apex Shippers',           email: 'sconnor@apexshippers.example.com',          phone: '+44-20-7946-0958',  notes: 'Specializes in European sea cargo and DDP.' },
  { id: 'fwd-3', name: 'Vikram Singh',   company: 'Indo-Pacific Logistics',  email: 'ops@indopacificlogistics.example.com',      phone: '+91-22-5550-1234',  notes: 'Reliable road transport across India.' },
  { id: 'fwd-4', name: 'Elena Rostova',  company: 'Eurasia Freight Alliance', email: 'elena.r@eurasiafreight.example.com',        phone: '+49-89-2019-3829',  notes: 'Perishable and fragile shipment specialist.' },
];

const SEED_QUOTES = [
  { id: 'q-1', referenceId: 'FB-20260510-4821', origin: 'Mumbai, India',  destination: 'Hamburg, Germany', cargoType: 'General',  weight: 1250, dimensions: '120x80x160 cm', declaredValue: 45000, incoterms: 'FOB', mode: 'Sea', readyDate: '2026-06-01', specialInstructions: 'Standard pallets. Stackable.', deadline: '2026-05-22', status: 'Sent',    createdAt: '2026-05-10T14:22:15.000Z', emailedCount: 4 },
  { id: 'q-2', referenceId: 'FB-20260514-9912', origin: 'Chicago, USA',   destination: 'Tokyo, Japan',     cargoType: 'Fragile',  weight: 180,  dimensions: '80x60x90 cm',   declaredValue: 12000, incoterms: 'EXW', mode: 'Air', readyDate: '2026-05-28', specialInstructions: 'Delicate lab equipment. No stacking.', deadline: '2026-05-20', status: 'Sent',    createdAt: '2026-05-14T09:15:30.000Z', emailedCount: 4 },
  { id: 'q-3', referenceId: 'FB-20260517-1052', origin: 'London, UK',     destination: 'Dubai, UAE',       cargoType: 'Perishable', weight: 340, dimensions: '100x100x120 cm', declaredValue: 8500, incoterms: 'DDP', mode: 'Air', readyDate: '2026-05-25', specialInstructions: 'Pharma cold chain 2-8°C required.', deadline: '2026-05-21', status: 'Pending', createdAt: '2026-05-17T11:45:00.000Z', emailedCount: 0 },
];

// ── Init on first load ────────────────────────────────────────
export function initStorage() {
  if (!localStorage.getItem(LS_FWD))    localStorage.setItem(LS_FWD,    JSON.stringify(SEED_FORWARDERS));
  if (!localStorage.getItem(LS_QUOTES)) localStorage.setItem(LS_QUOTES, JSON.stringify(SEED_QUOTES));
}

// ── Forwarders ────────────────────────────────────────────────
export function getForwarders() {
  return JSON.parse(localStorage.getItem(LS_FWD) || '[]');
}
export function saveForwarders(data) {
  localStorage.setItem(LS_FWD, JSON.stringify(data));
}
export function addForwarder(fwd) {
  const list = getForwarders();
  const item = { id: `fwd-${Date.now()}`, ...fwd };
  saveForwarders([...list, item]);
  return item;
}
export function updateForwarder(id, fwd) {
  const list = getForwarders().map(f => f.id === id ? { ...f, ...fwd } : f);
  saveForwarders(list);
}
export function deleteForwarder(id) {
  saveForwarders(getForwarders().filter(f => f.id !== id));
}

// ── Quotes ────────────────────────────────────────────────────
export function getQuotes() {
  const list = JSON.parse(localStorage.getItem(LS_QUOTES) || '[]');
  return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export function saveQuotes(data) {
  localStorage.setItem(LS_QUOTES, JSON.stringify(data));
}
export function addQuote(q) {
  const list = JSON.parse(localStorage.getItem(LS_QUOTES) || '[]');
  const item = { id: `q-${Date.now()}`, ...q, status: 'Pending', createdAt: new Date().toISOString(), emailedCount: 0 };
  saveQuotes([...list, item]);
  return item;
}
export function updateQuoteStatus(id, status, emailedCount) {
  const list = JSON.parse(localStorage.getItem(LS_QUOTES) || '[]').map(q =>
    q.id === id ? { ...q, status, emailedCount } : q
  );
  saveQuotes(list);
}

// ── Ref ID generator ──────────────────────────────────────────
export function genRefId() {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `FB-${ds}-${Math.floor(1000+Math.random()*9000)}`;
}

// ── Email dispatcher (calls /api/send-email) ──────────────────
export async function dispatchEmails(quote, forwarders) {
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quote, forwarders })
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

// ── PDF print ─────────────────────────────────────────────────
export function printQuotePDF(quote) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>${quote.referenceId}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1C1009}
  h1{color:#F97316;font-size:26px;margin:0}
  .sub{color:#8C7560;font-size:13px;margin-bottom:30px}
  table{width:100%;border-collapse:collapse}
  td{padding:10px 12px;border-bottom:1px solid #FFE5CC;font-size:13px}
  .lbl{font-weight:600;background:#FFFBF5;width:35%}
  .note{margin-top:24px;padding:14px;border-left:4px solid #F97316;background:#FFFBF5;font-size:13px}
  .ftr{margin-top:48px;border-top:1px solid #FFE5CC;padding-top:14px;font-size:11px;color:#8C7560;text-align:center}
</style></head><body>
<h1>FreightBid — Quotation Request</h1>
<div class="sub">Reference: ${quote.referenceId} &nbsp;|&nbsp; Generated ${new Date().toLocaleDateString()}</div>
<table>
  <tr><td class="lbl">Origin</td><td>${quote.origin}</td></tr>
  <tr><td class="lbl">Destination</td><td>${quote.destination}</td></tr>
  <tr><td class="lbl">Mode</td><td>${quote.mode}</td></tr>
  <tr><td class="lbl">Cargo Type</td><td>${quote.cargoType}</td></tr>
  <tr><td class="lbl">Weight</td><td>${quote.weight} kg</td></tr>
  <tr><td class="lbl">Dimensions</td><td>${quote.dimensions||'N/A'}</td></tr>
  <tr><td class="lbl">Declared Value</td><td>${quote.declaredValue?`$${Number(quote.declaredValue).toLocaleString()}`:'N/A'}</td></tr>
  <tr><td class="lbl">Incoterms</td><td>${quote.incoterms}</td></tr>
  <tr><td class="lbl">Ready Date</td><td>${quote.readyDate||'ASAP'}</td></tr>
  <tr><td class="lbl">Response Deadline</td><td>${quote.deadline||'ASAP'}</td></tr>
  <tr><td class="lbl">Status</td><td>${quote.status}</td></tr>
</table>
${quote.specialInstructions?`<div class="note"><strong>Special Instructions:</strong> ${quote.specialInstructions}</div>`:''}
<div class="ftr">FreightBid Logistics Platform &copy; ${new Date().getFullYear()}</div>
<script>window.onload=()=>window.print();</script>
</body></html>`);
  w.document.close();
}

// ── Copy email template to clipboard ──────────────────────────
export function copyEmailTemplate(quote) {
  const txt = `Subject: Freight Quotation Request – ${quote.referenceId} | ${quote.origin} to ${quote.destination}

Dear [Forwarder Name],

We have a new shipment and invite your best freight bid.

SHIPMENT DETAILS:
- Reference: ${quote.referenceId}
- Origin: ${quote.origin}
- Destination: ${quote.destination}
- Cargo: ${quote.cargoType}
- Weight: ${quote.weight} kg
- Dimensions: ${quote.dimensions||'N/A'}
- Declared Value: ${quote.declaredValue?`$${Number(quote.declaredValue).toLocaleString()}`:'N/A'}
- Incoterms: ${quote.incoterms}
- Mode: ${quote.mode}
- Ready Date: ${quote.readyDate||'ASAP'}
- Instructions: ${quote.specialInstructions||'None'}

Please reply with: (1) Total price, (2) Transit time, (3) Any conditions.
Response Deadline: ${quote.deadline||'ASAP'}

Thank you,
FreightBid Logistics`;
  navigator.clipboard.writeText(txt);
}
