require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem.model');

const imageMap = {
    'Grilled Chicken with Herbs': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    'Seafood Platter': 'https://images.unsplash.com/photo-1559737558-2f5a35f4523e?w=400',
    'Beef Steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    'Vegetable Curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    'Chicken Mixed Fried Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    'Caesar Salad': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    'Chicken Wings': 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400',
    'Spring Rolls': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400',
    'Garlic Bread': 'https://images.unsplash.com/photo-1573140401552-388e3ead0b7c?w=400',
    'Soup of the Day': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    'Chocolate Lava Cake': 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
    'Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    'Ice Cream Sundae': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    'Fruit Salad': 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400',
    'Cheesecake': 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400',
    'Fresh Orange Juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    'Mango Smoothie': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
    'Iced Coffee': 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    'Green Tea': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400',
    'Mojito Mocktail': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400',
    'Spaghetti Carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    'Pad Thai': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400',
    'Penne Arrabiata': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    'Chicken Chow Mein': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    'Seafood Linguine': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400',
    'French Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    'Onion Rings': 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400',
    'Coleslaw': 'https://images.unsplash.com/photo-1625938145312-c260f0f4a6c0?w=400',
    'Mashed Potatoes': 'https://images.unsplash.com/photo-1585307269-f2d6e2c8e1b5?w=400',
    'Grilled Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'
};

async function updateImages() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        for (const [name, imageUrl] of Object.entries(imageMap)) {
            await MenuItem.updateOne({ name }, { imageUrl });
            console.log(`✅ Updated image for: ${name}`);
        }

        console.log('\n🎉 All images updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateImages();
