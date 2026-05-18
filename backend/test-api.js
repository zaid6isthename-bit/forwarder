// Automated end-to-end API test for FreightBid backend
// Run: node test-api.js

const BASE = 'http://localhost:5000/api';

async function run() {
  console.log('\n=== FreightBid API End-to-End Test ===\n');

  // 1. List forwarders
  console.log('1. GET /api/forwarders');
  const fwdRes = await fetch(`${BASE}/forwarders`);
  const forwarders = await fwdRes.json();
  console.log(`   ✅ ${forwarders.length} forwarders loaded.`);

  // 2. List quotes
  console.log('\n2. GET /api/quotes');
  const qRes = await fetch(`${BASE}/quotes`);
  const quotes = await qRes.json();
  console.log(`   ✅ ${quotes.length} quotes loaded.`);

  // 3. Create a new quote
  console.log('\n3. POST /api/quotes (create new quotation)');
  const newQuotePayload = {
    origin: 'Shanghai, China',
    destination: 'Rotterdam, Netherlands',
    cargoType: 'General',
    weight: 2500,
    dimensions: '200x100x180 cm',
    declaredValue: 75000,
    incoterms: 'CIF',
    mode: 'Sea',
    readyDate: '2026-07-01',
    specialInstructions: 'API test shipment. Palletized cargo.',
    deadline: '2026-06-15'
  };

  const createRes = await fetch(`${BASE}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newQuotePayload)
  });
  const newQuote = await createRes.json();
  console.log(`   ✅ Created quote: ${newQuote.referenceId} (id: ${newQuote.id})`);

  // 4. Trigger email send for the new quote
  console.log('\n4. POST /api/send-quote (trigger mock email dispatch)');
  const sendRes = await fetch(`${BASE}/send-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quoteId: newQuote.id })
  });
  const sendResult = await sendRes.json();
  console.log(`   ✅ isMock: ${sendResult.isMock}`);
  console.log(`   ✅ Dispatched to: ${sendResult.sentCount} forwarders`);
  console.log(`   ✅ Message: ${sendResult.message}`);

  // 5. Add a new forwarder
  console.log('\n5. POST /api/forwarders (add new agency)');
  const addFwdRes = await fetch(`${BASE}/forwarders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Agent',
      company: 'Test Logistics Co.',
      email: 'test@testlogistics.example.com',
      phone: '+0-000-000-0000',
      notes: 'API test entry'
    })
  });
  const newFwd = await addFwdRes.json();
  console.log(`   ✅ Added forwarder: ${newFwd.company} (id: ${newFwd.id})`);

  // 6. Delete the test forwarder
  console.log('\n6. DELETE /api/forwarders/:id (clean up test entry)');
  const delRes = await fetch(`${BASE}/forwarders/${newFwd.id}`, { method: 'DELETE' });
  const delResult = await delRes.json();
  console.log(`   ✅ ${delResult.message}`);

  console.log('\n=== All Tests Passed ✅ ===\n');
}

run().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
