const { MongoClient } = require('mongodb');

// Constructing connection string with raw IPs and replicaSet name
// ac-rggzz72-shard-00-00.4aw02aj.mongodb.net -> 65.62.37.57
// ac-rggzz72-shard-00-01.4aw02aj.mongodb.net -> 65.62.37.71
// ac-rggzz72-shard-00-02.4aw02aj.mongodb.net -> 65.62.37.64

const uri = 'mongodb://mohammedfareeddev_db_user:JoshuaKimmich6@65.62.37.57:27017,65.62.37.71:27017,65.62.37.64:27017/stitch_store?replicaSet=atlas-l5pynp-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Clusterfareed&tlsAllowInvalidHostnames=true';

async function test() {
  console.log('Testing direct IP connection...');
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Success connecting via raw IPs!');
    const db = client.db('stitch_store');
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error('Error connecting:', err);
  }
}

test();
