const { MongoClient } = require('mongodb');
const dns = require('dns');
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

// Override DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@clusterfareed.4aw02aj.mongodb.net/stitch_store?retryWrites=true&w=majority&appName=Clusterfareed`;

async function test() {
  console.log('Testing direct resolveSrv...');
  dns.resolveSrv('_mongodb._tcp.clusterfareed.4aw02aj.mongodb.net', (err, addresses) => {
    if (err) {
      console.error('dns.resolveSrv error:', err);
    } else {
      console.log('dns.resolveSrv addresses:', addresses);
    }
  });

  console.log('Testing MongoClient connection with srv...');
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Success connecting with srv!');
    const db = client.db('stitch_store');
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error('Error connecting with srv:', err);
  }
}

test();
