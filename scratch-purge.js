const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read MONGODB_URI from .env.local
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match) {
      MONGODB_URI = match[1].trim();
    }
  } catch (err) {
    console.error('Could not read .env.local', err);
  }
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI missing');
  process.exit(1);
}

async function purgeDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas.');

    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));

    for (const col of collections) {
      if (col.name === 'users') {
        const res = await db.collection('users').deleteMany({ role: { $ne: 'super_admin' } });
        console.log(`Cleared ${res.deletedCount} non-superadmin users.`);
      } else {
        const res = await db.collection(col.name).deleteMany({});
        console.log(`Cleared ${res.deletedCount} documents from '${col.name}'.`);
      }
    }

    // Ensure Super Admin exists
    const superAdmin = await db.collection('users').findOne({ role: 'super_admin' });
    if (!superAdmin) {
      await db.collection('users').insertOne({
        name: 'Super Admin',
        email: 'superadmin@africart.com',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date(),
      });
      console.log('Created default Super Admin account (superadmin@africart.com).');
    } else {
      console.log('Super Admin account preserved:', superAdmin.email);
    }

    console.log('🎉 Database successfully purged for fresh testing!');
    process.exit(0);
  } catch (err) {
    console.error('Error purging database:', err);
    process.exit(1);
  }
}

purgeDatabase();
