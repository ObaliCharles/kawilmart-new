require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...');
console.log('Connection String:', process.env.MONGODB_URI ? 'Loaded ✅' : 'NOT LOADED ❌');
console.log('URI Preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/([^:@]+):([^@]+)@/, '//***:***@').substring(0, 50) + '...' : 'undefined');
console.log('');

if (!process.env.MONGODB_URI) {
  console.log('❌ .env file not loaded properly');
  console.log('💡 Make sure .env file exists and has MONGODB_URI');
  process.exit(1);
}

if (process.env.MONGODB_URI.includes('<db_password>')) {
  console.log('❌ PASSWORD PLACEHOLDER FOUND!');
  console.log('💡 Replace <db_password> in .env with your actual MongoDB password');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
}).then(() => {
  console.log('✅ SUCCESS: Connected to MongoDB!');
  console.log('Database:', mongoose.connection.db.databaseName);
  console.log('Host:', mongoose.connection.host);
  return mongoose.connection.close();
}).catch(err => {
  console.log('❌ CONNECTION FAILED');
  console.log('Error:', err.message);

  if (err.message.includes('authentication failed')) {
    console.log('🔑 ISSUE: Wrong username/password');
    console.log('💡 Check your MongoDB Atlas database user credentials');
  } else if (err.message.includes('getaddrinfo ENOTFOUND')) {
    console.log('🔗 ISSUE: Invalid cluster URL');
    console.log('💡 Verify cluster URL in MongoDB Atlas');
  } else if (err.message.includes('connection timed out') || err.message.includes('Server selection timed out')) {
    console.log('⏱️ ISSUE: Network timeout - check IP whitelist');
    console.log('💡 Add your IP to MongoDB Atlas network access');
  } else if (err.message.includes('cluster is paused')) {
    console.log('😴 ISSUE: Cluster is paused');
    console.log('💡 Resume cluster in MongoDB Atlas dashboard');
  } else {
    console.log('❓ ISSUE: Unknown error - check Atlas dashboard');
  }
});
