const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Local MongoDB URI
const LOCAL_URI = 'mongodb://localhost:27017/restaurant';

// Collections to export
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

// Create backup directory
const backupDir = path.join(__dirname, 'mongodb-backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

console.log('🚀 Starting MongoDB export...\n');
console.log(`📁 Backup directory: ${backupDir}\n`);

async function exportData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Connected to local MongoDB\n');

    let totalDocs = 0;
    let totalSize = 0;

    // Export each collection
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const data = await collection.find({}).toArray();
        
        const outputFile = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
        
        const fileSize = (fs.statSync(outputFile).size / 1024).toFixed(2);
        totalSize += parseFloat(fileSize);
        totalDocs += data.length;
        
        console.log(`✅ ${collectionName}: ${data.length} documents (${fileSize} KB)`);
      } catch (err) {
        console.log(`⚠️  ${collectionName}: No data or error (${err.message})`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Export Summary:');
    console.log(`   📄 Total Documents: ${totalDocs}`);
    console.log(`   💾 Total Size: ${totalSize.toFixed(2)} KB`);
    console.log(`   📁 Location: ${backupDir}`);
    console.log('='.repeat(50));
    
    console.log('\n✨ Export completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Create MongoDB Atlas account at: https://www.mongodb.com/cloud/atlas/register');
    console.log('2. Get your Atlas connection string');
    console.log('3. Run: node importData.js "your-atlas-connection-string"');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   • MongoDB is running on localhost:27017');
    console.log('   • Database name is "restaurant"');
    console.log('   • You have data in the database');
    process.exit(1);
  }
}

exportData();
