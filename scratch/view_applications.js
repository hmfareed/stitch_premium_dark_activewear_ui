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

const VendorApplicationSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  email:            { type: String, required: true },
  phone:            { type: String, required: true },
  role:             { type: String, required: true },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedAt:        { type: Date, default: Date.now },
});

const VendorApplication = mongoose.models.VendorApplication || mongoose.model('VendorApplication', VendorApplicationSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const list = await VendorApplication.find().sort({ appliedAt: -1 }).limit(10);
    console.log('Last 10 applications:');
    list.forEach(app => {
      console.log(`ID: ${app._id}, Name: ${app.name}, Email: ${app.email}, Status: ${app.status}, Date: ${app.appliedAt}`);
    });
  } catch (err) {
    console.error('Error listing:', err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
