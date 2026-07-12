const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    process.env[key] = val;
  }
});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const db = mongoose.connection.db;
    const indexes = await db.collection('vendorapplications').indexes();
    console.log('Indexes on vendorapplications:');
    console.log(JSON.stringify(indexes, null, 2));
  } catch (err) {
    console.error('Error fetching indexes:', err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
