const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./src/models/Category.model');

dotenv.config();

const INITIAL_CATEGORIES = ["Noodles / Pasta", "Desserts", "Side Dishes"];

async function seedCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant');
        console.log('MongoDB Connected');

        for (const catName of INITIAL_CATEGORIES) {
            const exists = await Category.findOne({ name: catName });
            if (!exists) {
                await Category.create({ name: catName });
                console.log(`Created category: ${catName}`);
            } else {
                console.log(`Category already exists: ${catName}`);
            }
        }
        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed categories:', err);
        process.exit(1);
    }
}

seedCategories();
