require('dotenv').config();
const mongoose = require('mongoose');
const StockMovement = require('./src/models/StockMovement.model');
const Ingredient = require('./src/models/Ingredient.model');

const testAPI = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - 8);

        const movements = await StockMovement.find({
            type: 'USAGE',
            createdAt: { $gte: daysAgo }
        }).populate('ingredientId', 'name unit');

        console.log(`Found ${movements.length} usage movements\n`);

        // Calculate total usage per ingredient
        const totalUsage = {};
        movements.forEach(mov => {
            if (!mov.ingredientId) return;
            const ingName = mov.ingredientId.name;
            if (!totalUsage[ingName]) totalUsage[ingName] = 0;
            totalUsage[ingName] += mov.quantity;
        });

        const sortedIngredients = Object.entries(totalUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        console.log('=== PIE CHART DATA ===');
        console.log('Labels:', sortedIngredients.map(([name]) => name));
        console.log('Data:', sortedIngredients.map(([, qty]) => parseFloat(qty.toFixed(2))));
        
        const colors = ['#14b8a6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];
        console.log('Colors:', colors);

        console.log('\n=== DETAILED BREAKDOWN ===');
        sortedIngredients.forEach(([name, qty], idx) => {
            console.log(`${idx + 1}. ${name}: ${qty.toFixed(2)} kg - Color: ${colors[idx]}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

testAPI();
