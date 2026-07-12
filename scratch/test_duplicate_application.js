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
    const testData = {
      name: 'Fareed Test 2',
      email: 'vendortest@gmail.com', // Already exists as status 'rejected'
      phone: '0540000000',
      role: 'Vendor',
    };

    console.log('Trying to create application for existing email vendortest@gmail.com...');
    const app = await VendorApplication.create({
      ...testData,
      appliedAt: new Date(),
      status: 'pending',
    });
    console.log('Success! Created ID:', app._id);
    // Cleanup if successful so we don't pollute
    await VendorApplication.deleteOne({ _id: app._id });
  } catch (err) {
    console.error('FAILED during creation:');
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
