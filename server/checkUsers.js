const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://oceanbreeze:admin123@oceanbreeze.kpseoy1.mongodb.net/restaurant';

async function checkUsers() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to Atlas\n');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users:\n`);
    users.forEach(u => {
      console.log(`📧 Email: ${u.email}`);
      console.log(`👤 Name: ${u.name}`);
      console.log(`🔑 Role: ${u.role}`);
      console.log(`🔒 Has Password: ${u.password ? 'Yes' : 'No'}`);
      console.log('---');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUsers();
