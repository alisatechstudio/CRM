require('dotenv').config();
const mongoose = require('mongoose');
const { wipeAllCollections } = require('./mongoConnection');

async function runClean() {
  const customUri = process.argv[2];
  const uri = customUri || process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!uri) {
    console.error('❌ Error: No MongoDB connection string provided.');
    console.log('Usage:');
    console.log('  node server/cleanDatabase.js "mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/database"');
    console.log('Or set MONGODB_URI in your .env file and run:');
    console.log('  npm run db:clean');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    console.log('Cleaning all collections...');
    const results = await wipeAllCollections();

    console.log('\n🧹 Database Cleanup Complete! All collections are now 100% BLANK (0 records):');
    console.table(results);

    await mongoose.disconnect();
    console.log('Disconnected. Done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cleaning database:', err);
    process.exit(1);
  }
}

runClean();
