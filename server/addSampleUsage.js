require('dotenv').config();
const mongoose = require('mongoose');
const StockMovement = require('./src/models/StockMovement.model');
const Ingredient = require('./src/models/Ingredient.model');
const User = require('./src/models/User.model');

const addSampleUsage = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Get admin user
        const admin = await User.findOne({ role: 'ADMIN' });
        if (!admin) {
            console.log('❌ Admin user not found');
            process.exit(1);
        }

        // Get all ingredients
        const ingredients = await Ingredient.find();
        if (ingredients.length === 0) {
            console.log('❌ No ingredients found');
            process.exit(1);
        }

        console.log(`\nFound ${ingredients.length} ingredients`);

        // Clear existing stock movements
        await StockMovement.deleteMany({});
        console.log('✓ Cleared existing stock movements');

        // Generate usage data for last 8 days
        const usageData = [];
        const today = new Date();

        for (let i = 7; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(10, 0, 0, 0);

            // Add usage for each ingredient with random quantities
            for (const ingredient of ingredients) {
                const baseUsage = {
                    'Chicken Breast': { min: 5, max: 15 },
                    'Rice': { min: 10, max: 25 },
                    'Tomatoes': { min: 3, max: 8 },
                    'Olive Oil': { min: 1, max: 3 },
                    'Fresh Milk': { min: 5, max: 12 }
                };

                const range = baseUsage[ingredient.name] || { min: 2, max: 10 };
                const quantity = (Math.random() * (range.max - range.min) + range.min).toFixed(2);

                usageData.push({
                    ingredientId: ingredient._id,
                    type: 'USAGE',
                    quantity: parseFloat(quantity),
                    reason: `Daily kitchen usage - ${date.toLocaleDateString()}`,
                    staffId: admin._id,
                    createdAt: date,
                    updatedAt: date
                });
            }
        }

        // Insert all usage records
        await StockMovement.insertMany(usageData);
        console.log(`✓ Added ${usageData.length} usage records (8 days × ${ingredients.length} ingredients)`);

        // Show summary
        console.log('\n=== USAGE SUMMARY ===');
        for (const ingredient of ingredients) {
            const movements = usageData.filter(m => m.ingredientId.toString() === ingredient._id.toString());
            const total = movements.reduce((sum, m) => sum + m.quantity, 0);
            console.log(`${ingredient.name}: ${total.toFixed(2)} ${ingredient.unit} (${movements.length} records)`);
        }

        console.log('\n✅ Sample usage data added successfully!');
        console.log('Now refresh your analytics page to see the charts.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

addSampleUsage();
