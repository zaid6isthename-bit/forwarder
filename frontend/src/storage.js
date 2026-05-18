const LS_FWD    = 'fb_forwarders_v3';
const LS_QUOTES = 'fb_quotes_v3';
const LS_BIDS   = 'fb_bids_v3';

// ── Seed data (loaded once on first launch) ───────────────────
const SEED_FORWARDERS = [];
const SEED_QUOTES = [];
const SEED_BIDS = [];

// ── Init on first load ────────────────────────────────────────
export function initStorage() {
  if (!localStorage.getItem(LS_FWD))    localStorage.setItem(LS_FWD,    JSON.stringify(SEED_FORWARDERS));
  if (!localStorage.getItem(LS_QUOTES)) localStorage.setItem(LS_QUOTES, JSON.stringify(SEED_QUOTES));
  if (!localStorage.getItem(LS_BIDS))   localStorage.setItem(LS_BIDS,   JSON.stringify(SEED_BIDS));
}

// ── Bids & AI Scoring ─────────────────────────────────────────
export function getBids(quoteId = null) {
  let list = JSON.parse(localStorage.getItem(LS_BIDS) || '[]');
  if (quoteId) list = list.filter(b => b.quoteId === quoteId);
  
  // Calculate AI Score if not present
  if (list.length > 0) {
    const minPrice = Math.min(...list.map(b => b.price));
    const minDays  = Math.min(...list.map(b => b.transitTimeDays));
    
    list = list.map(b => {
      const fwd = getForwarders().find(f => f.id === b.forwarderId);
      const reliability = fwd ? fwd.reliability || 80 : 80;
      
      // Basic AI logic for scoring
      const priceScore = (minPrice / b.price) * 40; // 40% weight
      const timeScore  = (minDays / b.transitTimeDays) * 30; // 30% weight
      const relScore   = (reliability / 100) * 20; // 20% weight
      const compScore  = (b.completeness / 100) * 10; // 10% weight
      
      const totalScore = priceScore + timeScore + relScore + compScore;
      
      return {
        ...b,
        score: Math.round(totalScore),
        isLowestPrice: b.price === minPrice,
        isFastest: b.transitTimeDays === minDays,
        forwarder: fwd
      };
    });
    
    // Sort by AI score descending
    list.sort((a, b) => b.score - a.score);
    if (list.length > 0) {
      list[0].isBestValue = true; // Highest score is best value
    }
  }
  return list;
}

export function updateBidStatus(id, status) {
  const list = JSON.parse(localStorage.getItem(LS_BIDS) || '[]').map(b =>
    b.id === id ? { ...b, status } : b
  );
  localStorage.setItem(LS_BIDS, JSON.stringify(list));
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
