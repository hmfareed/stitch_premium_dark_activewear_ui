async function run() {
  const url = 'http://localhost:3000/api/vendor-applications';
  const payload = {
    name: 'Missing Phone Vendor',
    email: 'missing_phone@example.com',
    role: 'Vendor',
    // phone is missing!
  };

  console.log('Sending POST with missing phone to', url);
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
