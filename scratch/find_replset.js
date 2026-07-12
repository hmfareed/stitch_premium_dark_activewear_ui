const { MongoClient } = require('mongodb');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'mongodb+srv://mohammedfareeddev_db_user:JoshuaKimmich6@clusterfareed.4aw02aj.mongodb.net/stitch_store?retryWrites=true&w=majority&appName=Clusterfareed';

async function test() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const adminDb = client.db().admin();
    const status = await adminDb.replSetGetStatus();
    console.log('Replica Set name:', status.set);
    console.log('Hosts:', status.members.map(m => m.name));
    await client.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
