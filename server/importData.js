const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Get Atlas URI from command line argument
const ATLAS_URI = process.argv[2];

if (!ATLAS_URI) {
  console.error('❌ Error: Please provide MongoDB Atlas connection string');
  console.log('\nUsage:');
  console.log('  node importData.js "mongodb+srv://username:password@cluster.mongodb.net/restaurant"');
  console.log('\nExample:');
  console.log('  node importData.js "mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/restaurant"');
  process.exit(1);
}

// Collections to import
const collections = [
  'users',
  'tables',
  'suppliers',
  'stockmovements',
  'reservations',
  'pricehistories',
  'orders',
  'menuitems',
  'ingredients',
  'categories',
  'auditlogs'
];

const backupDir = path.join(__dirname, 'mongodb-backup');

if (!fs.existsSync(backupDir)) {
  console.error(`❌ Error: Backup directory not found: ${backupDir}`);
  console.log('\n📝 Please run exportData.js first to create backup files');
  process.exit(1);
}

console.log('🚀 Starting MongoDB import to Atlas...\n');
console.log(`📁 Reading from: ${backupDir}\n`);

async function importData() {
  let successful = 0;
  let failed = 0;
  let totalDocs = 0;

  try {
    // Connect to Atlas
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas!\n');

    // Import each collection
    for (const collectionName of collections) {
      const inputFile = path.join(backupDir, `${collectionName}.json`);
      
      if (!fs.existsSync(inputFile)) {
        console.log(`⚠️  ${collectionName}: Skipped (file not found)`);
        continue;
      }

      try {
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        
        if (data.length === 0) {
          console.log(`⚠️  ${collectionName}: Skipped (no data)`);
          continue;
        }

        const collection = mongoose.connection.db.collection(collectionName);
        
        // Drop existing data and insert new
        await collection.deleteMany({});
        await collection.insertMany(data);
        
        successful++;
        totalDocs += data.length;
        console.log(`✅ ${collectionName}: Imported ${data.length} documents`);
      } catch (err) {
        failed++;
        console.log(`❌ ${collectionName}: Failed (${err.message})`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary:');
    console.log(`   ✅ Successful: ${successful} collections`);
    console.log(`   ❌ Failed: ${failed} collections`);
    console.log(`   📄 Total Documents: ${totalDocs}`);
    console.log('='.repeat(50));
    
    if (successful > 0) {
      console.log('\n✨ Data successfully imported to MongoDB Atlas!');
      console.log('\n📝 Next steps:');
      console.log('1. Update your .env file with the Atlas connection string');
      console.log('2. Share the connection string with your team');
      console.log('3. Make sure to whitelist team members\' IPs in Atlas Network Access');
      console.log('\n🔗 Your Atlas URI:');
      console.log(`   ${ATLAS_URI}`);
    }
    
    if (failed > 0) {
      console.log('\n⚠️  Some imports failed. Check the error messages above.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   • Wrong username/password in connection string');
    console.log('   • IP address not whitelisted (add 0.0.0.0/0 in Atlas Network Access)');
    console.log('   • Network connectivity issues');
    console.log('   • Database name mismatch');
    process.exit(1);
  }
}

importData();
