const { MongoClient } = require('mongodb');
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

if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Extract credentials from MONGODB_URI to dynamically build connection string
const credentialsMatch = process.env.MONGODB_URI.match(/mongodb(?:\+srv)?:\/\/([^:]+):([^@]+)@/);
if (!credentialsMatch) {
  console.error('Error: Could not parse credentials from MONGODB_URI in .env.local');
  process.exit(1);
}
const username = decodeURIComponent(credentialsMatch[1]);
const password = decodeURIComponent(credentialsMatch[2]);

// Constructing connection string with direct hostnames (No SRV lookup)
const uri = `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@ac-rggzz72-shard-00-00.4aw02aj.mongodb.net:27017,ac-rggzz72-shard-00-01.4aw02aj.mongodb.net:27017,ac-rggzz72-shard-00-02.4aw02aj.mongodb.net:27017/stitch_store?replicaSet=atlas-l5pynp-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Clusterfareed`;

async function test() {
  console.log('Testing direct hostname connection without custom DNS...');
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Success connecting directly via hostnames!');
    const db = client.db('stitch_store');
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error('Error connecting:', err);
  }
}

test();
