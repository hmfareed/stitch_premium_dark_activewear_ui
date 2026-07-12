async function run() {
  const url = 'http://localhost:3000/api/vendor-applications';
  const payload = {
    name: 'Trigger Test Vendor',
    email: 'trigger_vendor_1@example.com',
    phone: '0541112222',
    role: 'Vendor',
    businessType: 'sole_trader',
    storeName: 'Trigger Store 1',
  };

  console.log('Sending POST to', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response data:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
