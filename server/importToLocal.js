const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Local MongoDB URI
const LOCAL_URI = 'mongodb://localhost:27017/restaurant';

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
  console.log('\n📝 Please make sure mongodb-backup folder exists with JSON files');
  process.exit(1);
}

console.log('🚀 Starting MongoDB import to Local Database...\n');
console.log(`📁 Reading from: ${backupDir}\n`);

async function importData() {
  let successful = 0;
  let failed = 0;
  let totalDocs = 0;

  try {
    // Connect to Local MongoDB
    console.log('🔗 Connecting to Local MongoDB...');
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Connected to Local Database!\n');

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
      console.log('\n✨ Data successfully imported to Local MongoDB!');
      console.log('\n📝 Next steps:');
      console.log('1. Make sure .env file has: MONGO_URI=mongodb://localhost:27017/restaurant');
      console.log('2. Restart your server: npm start');
      console.log('3. Open browser and login');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   • MongoDB is running on localhost:27017');
    console.log('   • You have MongoDB installed');
    process.exit(1);
  }
}

importData();
