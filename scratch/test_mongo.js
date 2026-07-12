const { MongoClient } = require('mongodb');
const dns = require('dns');

// Override DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'mongodb+srv://mohammedfareeddev_db_user:JoshuaKimmich6@clusterfareed.4aw02aj.mongodb.net/stitch_store?retryWrites=true&w=majority&appName=Clusterfareed';

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
