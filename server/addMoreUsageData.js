require('dotenv').config();
const mongoose = require('mongoose');
const StockMovement = require('./src/models/StockMovement.model');
const Ingredient = require('./src/models/Ingredient.model');
const User = require('./src/models/User.model');

const addMoreUsageData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get ingredients
        const ingredients = await Ingredient.find();
        console.log(`\n📦 Found ${ingredients.length} ingredients`);

        if (ingredients.length === 0) {
            console.log('❌ No ingredients found. Please add ingredients first.');
            process.exit(1);
        }

        // Get admin user
        const admin = await User.findOne({ role: 'ADMIN' });
        if (!admin) {
            console.log('❌ No admin user found.');
            process.exit(1);
        }

        // Clear existing usage data
        await StockMovement.deleteMany({ type: 'USAGE' });
        console.log('🗑️  Cleared existing usage data\n');

        // Create 10 varied usage records over the last 8 days
        const usageRecords = [];
        const today = new Date();

        // Distribute records across different ingredients and dates
        const recordsData = [
            { ingredientName: 'Rice', daysAgo: 0, quantity: 12.5 },
            { ingredientName: 'Chicken Breast', daysAgo: 0, quantity: 8.3 },
            { ingredientName: 'Tomatoes', daysAgo: 1, quantity: 5.2 },
            { ingredientName: 'Fresh Milk', daysAgo: 1, quantity: 6.8 },
            { ingredientName: 'Rice', daysAgo: 2, quantity: 11.0 },
            { ingredientName: 'Olive Oil', daysAgo: 2, quantity: 3.5 },
            { ingredientName: 'Chicken Breast', daysAgo: 3, quantity: 9.2 },
            { ingredientName: 'Tomatoes', daysAgo: 3, quantity: 4.7 },
            { ingredientName: 'cardamom', daysAgo: 4, quantity: 2.1 },
            { ingredientName: 'Fresh Milk', daysAgo: 4, quantity: 7.5 },
            { ingredientName: 'Rice', daysAgo: 5, quantity: 13.2 },
            { ingredientName: 'Chicken Breast', daysAgo: 5, quantity: 7.9 },
            { ingredientName: 'Olive Oil', daysAgo: 6, quantity: 4.2 },
            { ingredientName: 'Tomatoes', daysAgo: 6, quantity: 5.8 },
            { ingredientName: 'cardamom', daysAgo: 7, quantity: 1.9 },
            { ingredientName: 'Fresh Milk', daysAgo: 7, quantity: 6.3 }
        ];

        for (const record of recordsData) {
            const ingredient = ingredients.find(i => i.name === record.ingredientName);
            if (!ingredient) {
                console.log(`⚠️  Ingredient "${record.ingredientName}" not found, skipping...`);
                continue;
            }

            const recordDate = new Date(today);
            recordDate.setDate(recordDate.getDate() - record.daysAgo);

            const movement = await StockMovement.create({
                ingredientId: ingredient._id,
                type: 'USAGE',
                quantity: record.quantity,
                reason: 'Daily kitchen usage',
                staffId: admin._id,
                createdAt: recordDate
            });

            usageRecords.push(movement);
            console.log(`✅ Added: ${ingredient.name} - ${record.quantity} kg (${record.daysAgo} days ago)`);
        }

        console.log(`\n✅ Successfully added ${usageRecords.length} usage records!`);
        
        // Display summary
        console.log('\n📊 Usage Summary by Ingredient:\n');
        const summary = {};
        for (const record of recordsData) {
            if (!summary[record.ingredientName]) {
                summary[record.ingredientName] = 0;
            }
            summary[record.ingredientName] += record.quantity;
        }

        Object.entries(summary)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, total]) => {
                console.log(`   ${name}: ${total.toFixed(2)} kg`);
            });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

addMoreUsageData();
