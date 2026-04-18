require('dotenv').config();
const mongoose = require('mongoose');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const Category = require('./src/models/Category.model');
        const MenuItem = require('./src/models/MenuItem.model');

        // Create categories
        const categories = [
            { name: 'Starters', slug: 'starters' },
            { name: 'Main Course', slug: 'main-course' },
            { name: 'Desserts', slug: 'desserts' },
            { name: 'Beverages', slug: 'beverages' },
            { name: 'Noodles / Pasta', slug: 'noodles-pasta' },
            { name: 'Side Dishes', slug: 'side-dishes' }
        ];

        const createdCategories = [];
        for (const cat of categories) {
            const existing = await Category.findOne({ name: cat.name });
            if (!existing) {
                const created = await Category.create(cat);
                createdCategories.push(created);
                console.log(`✅ Created category: ${cat.name}`);
            } else {
                createdCategories.push(existing);
                console.log(`⏭️  Category exists: ${cat.name}`);
            }
        }

        // Create sample menu items
        const mainCourse = createdCategories.find(c => c.name === 'Main Course');
        const starters = createdCategories.find(c => c.name === 'Starters');
        const desserts = createdCategories.find(c => c.name === 'Desserts');
        const beverages = createdCategories.find(c => c.name === 'Beverages');
        const noodles = createdCategories.find(c => c.name === 'Noodles / Pasta');
        const sides = createdCategories.find(c => c.name === 'Side Dishes');

        const menuItems = [
            // Main Course (5 items)
            {
                name: 'Grilled Chicken with Herbs',
                categoryId: mainCourse._id,
                price: 1500,
                description: 'Tender grilled chicken marinated with fresh herbs and spices',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special", "Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400'
            },
            {
                name: 'Seafood Platter',
                categoryId: mainCourse._id,
                price: 2500,
                description: 'Fresh seafood selection with prawns, fish, and calamari',
                portionSize: 'Large (L)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special", "Spicy"],
                imageUrl: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523e?w=400'
            },
            {
                name: 'Beef Steak',
                categoryId: mainCourse._id,
                price: 2200,
                description: 'Premium beef steak cooked to perfection',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400'
            },
            {
                name: 'Vegetable Curry',
                categoryId: mainCourse._id,
                price: 900,
                description: 'Mixed vegetables in rich coconut curry sauce',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan", "Spicy"],
                imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'
            },
            {
                name: 'Chicken Mixed Fried Rice',
                categoryId: mainCourse._id,
                price: 1200,
                description: 'Delicious fried rice with chicken and vegetables',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400'
            },

            // Starters (5 items)
            {
                name: 'Caesar Salad',
                categoryId: starters._id,
                price: 700,
                description: 'Fresh caesar salad with crispy lettuce and parmesan',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan", "New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Chicken Wings',
                categoryId: starters._id,
                price: 850,
                description: 'Crispy chicken wings with special sauce',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Spicy", "Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Spring Rolls',
                categoryId: starters._id,
                price: 600,
                description: 'Crispy vegetable spring rolls with sweet chili sauce',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Garlic Bread',
                categoryId: starters._id,
                price: 450,
                description: 'Toasted bread with garlic butter and herbs',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Soup of the Day',
                categoryId: starters._id,
                price: 550,
                description: 'Chef\'s special soup made fresh daily',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Chef's Special", "Seasonal"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },

            // Desserts (5 items)
            {
                name: 'Chocolate Lava Cake',
                categoryId: desserts._id,
                price: 650,
                description: 'Warm chocolate cake with molten center',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special", "Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Tiramisu',
                categoryId: desserts._id,
                price: 700,
                description: 'Classic Italian dessert with coffee and mascarpone',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Ice Cream Sundae',
                categoryId: desserts._id,
                price: 500,
                description: 'Three scoops of ice cream with toppings',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Fruit Salad',
                categoryId: desserts._id,
                price: 450,
                description: 'Fresh seasonal fruits with honey dressing',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan", "Seasonal"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Cheesecake',
                categoryId: desserts._id,
                price: 750,
                description: 'Creamy New York style cheesecake',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },

            // Beverages (5 items)
            {
                name: 'Fresh Orange Juice',
                categoryId: beverages._id,
                price: 350,
                description: 'Freshly squeezed orange juice',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan", "New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Mango Smoothie',
                categoryId: beverages._id,
                price: 450,
                description: 'Creamy mango smoothie with yogurt',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Seasonal", "Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Iced Coffee',
                categoryId: beverages._id,
                price: 400,
                description: 'Cold brew coffee with ice',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Green Tea',
                categoryId: beverages._id,
                price: 300,
                description: 'Premium Japanese green tea',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Mojito Mocktail',
                categoryId: beverages._id,
                price: 500,
                description: 'Refreshing mint and lime mocktail',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },

            // Noodles / Pasta (5 items)
            {
                name: 'Spaghetti Carbonara',
                categoryId: noodles._id,
                price: 1100,
                description: 'Classic Italian pasta with creamy sauce and bacon',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special", "Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Pad Thai',
                categoryId: noodles._id,
                price: 950,
                description: 'Thai style stir-fried noodles with peanuts',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Spicy", "Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Penne Arrabiata',
                categoryId: noodles._id,
                price: 900,
                description: 'Spicy tomato pasta with garlic and chili',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Spicy", "Vegan"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Chicken Chow Mein',
                categoryId: noodles._id,
                price: 1000,
                description: 'Chinese style stir-fried noodles with chicken',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Seafood Linguine',
                categoryId: noodles._id,
                price: 1400,
                description: 'Linguine pasta with mixed seafood in white wine sauce',
                portionSize: 'Medium (M)',
                availability: 'AVAILABLE',
                isFeatured: true,
                tags: ["Chef's Special"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },

            // Side Dishes (5 items)
            {
                name: 'French Fries',
                categoryId: sides._id,
                price: 350,
                description: 'Crispy golden french fries',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Bestseller"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Onion Rings',
                categoryId: sides._id,
                price: 400,
                description: 'Crispy battered onion rings',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["New"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Coleslaw',
                categoryId: sides._id,
                price: 300,
                description: 'Fresh cabbage salad with creamy dressing',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Mashed Potatoes',
                categoryId: sides._id,
                price: 350,
                description: 'Creamy mashed potatoes with butter',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: [],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            },
            {
                name: 'Grilled Vegetables',
                categoryId: sides._id,
                price: 450,
                description: 'Seasonal vegetables grilled to perfection',
                portionSize: 'Small (S)',
                availability: 'AVAILABLE',
                isFeatured: false,
                tags: ["Vegan", "Seasonal"],
                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
            }
        ];

        for (const item of menuItems) {
            const existing = await MenuItem.findOne({ name: item.name });
            if (!existing) {
                await MenuItem.create(item);
                console.log(`✅ Created menu item: ${item.name}`);
            } else {
                console.log(`⏭️  Menu item exists: ${item.name}`);
            }
        }

        console.log('\n🎉 Database seeded successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedData();
