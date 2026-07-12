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

  businessType:     { type: String, enum: ['sole_trader', 'registered_business', 'informal'] },
  businessRegNumber:{ type: String },

  storeName:        { type: String },
  storeHandle:      { type: String },
  storeLogo:        { type: String },
  storeBanner:      { type: String },
  storeBio:         { type: String },
  storeCategories:  [{ type: String }],
  returnPolicy:     { type: String },

  documentUrl:      { type: String },
  proofOfAddress:   { type: String },

  payoutMethod:     { type: String, enum: ['momo', 'bank'] },
  payoutDetails:    { type: mongoose.Schema.Types.Mixed },

  reason:           { type: String },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  trustTier:        { type: String, enum: ['unverified', 'verified', 'featured'], default: 'unverified' },
  rejectionReason:  { type: String },
  commissionRate:   { type: Number },
  appliedAt:        { type: Date, default: Date.now },
  reviewedAt:       { type: Date },
});

const VendorApplication = mongoose.models.VendorApplication || mongoose.model('VendorApplication', VendorApplicationSchema);

async function run() {
  console.log('Connecting to mongoose...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected! Creating test application...');
  
  try {
    const testData = {
      name: 'Test Vendor',
      email: 'test_vendor_99@example.com',
      phone: '0541234567',
      role: 'Vendor',
      businessType: 'sole_trader',
      storeName: 'Test Store 99',
    };

    // Clean up existing if any
    await VendorApplication.deleteMany({ email: testData.email });

    const app = await VendorApplication.create({
      ...testData,
      appliedAt: new Date(),
      status: 'pending',
      trustTier: 'unverified',
    });

    console.log('Success! Created application ID:', app._id);
  } catch (err) {
    console.error('Error during creation:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Done.');
  }
}

run();
