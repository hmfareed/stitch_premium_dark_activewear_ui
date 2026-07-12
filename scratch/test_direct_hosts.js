const { MongoClient } = require('mongodb');

// Constructing connection string with direct hostnames (No SRV lookup)
const uri = 'mongodb://mohammedfareeddev_db_user:JoshuaKimmich6@ac-rggzz72-shard-00-00.4aw02aj.mongodb.net:27017,ac-rggzz72-shard-00-01.4aw02aj.mongodb.net:27017,ac-rggzz72-shard-00-02.4aw02aj.mongodb.net:27017/stitch_store?replicaSet=atlas-l5pynp-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Clusterfareed';

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
