async function run() {
  const url = 'http://localhost:3000/api/vendor-applications';
  const payload = {
    name: 'Fareed Developer Fast',
    email: 'fareed_dev_99_fast@example.com',
    phone: '0541112222',
    role: 'Vendor',
    businessType: 'sole_trader',
    storeName: 'Fareed Store Fast',
    storeCategories: ['Fashion'],
    acceptTerms: true,
  };

  console.log('Sending POST to', url);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`Status: ${res.status} (took ${elapsed}s)`);
    const data = await res.json();
    console.log('Response data:', data);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.error(`Fetch error (took ${elapsed}s):`, err);
  }
}

run();
