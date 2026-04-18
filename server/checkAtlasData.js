const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://restaurant_db:admin1234@restaurantcluster.btgilgz.mongodb.net/restaurant';

async function checkData() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas\n');

    const collections = [
      'users',
      'tables',
      'suppliers',
      'stockmovements',
      'orders',
      'menuitems',
      'ingredients',
      'categories'
    ];

    console.log('📊 Data in Atlas Database:\n');
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName);
      const count = await collection.countDocuments();
      
      if (count > 0) {
        console.log(`✅ ${collectionName}: ${count} documents`);
        
        // Show first document as sample
        const sample = await collection.findOne();
        if (sample) {
          console.log(`   Sample: ${JSON.stringify(sample).substring(0, 100)}...`);
        }
      } else {
        console.log(`⚠️  ${collectionName}: 0 documents`);
      }
      console.log('');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
