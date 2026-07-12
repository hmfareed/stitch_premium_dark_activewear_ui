async function run() {
  const url = 'http://localhost:3000/api/auth/register/vendor';
  const payload = {
    name: 'Test Vendor Reg',
    email: 'test_vendor_reg_1@example.com',
    phone: '0543334444',
    password: 'Password123!',
    businessName: 'Reg Business 1',
    businessCategory: 'Fashion',
    momoNumber: '0543334444',
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
