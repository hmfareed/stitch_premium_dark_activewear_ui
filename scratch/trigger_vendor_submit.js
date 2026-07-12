async function run() {
  const url = 'http://localhost:3000/api/vendor-applications';
  const payload = {
    name: 'Fareed Developer',
    email: 'fareed_dev_99@example.com',
    phone: '0541112222',
    role: 'Vendor',
    businessType: 'sole_trader',
    storeName: 'Fareed Store',
    storeCategories: ['Fashion'],
    acceptTerms: true,
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
