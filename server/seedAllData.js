require('dotenv').config();
const mongoose = require('mongoose');

const seedAllData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const Ingredient = require('./src/models/Ingredient.model');
        const Table = require('./src/models/Table.model');
        const Supplier = require('./src/models/Supplier.model');
        const Order = require('./src/models/Order.model');
        const User = require('./src/models/User.model');
        const MenuItem = require('./src/models/MenuItem.model');

        // Get admin user for orders
        const admin = await User.findOne({ role: 'ADMIN' });
        const waiter = await User.findOne({ role: 'WAITER' });

        // ===== INVENTORY / INGREDIENTS (5 items) =====
        console.log('📦 Creating Inventory Items...');
        const ingredients = [
            {
                name: 'Chicken Breast',
                unit: 'kg',
                quantity: 50,
                minLevel: 10,
                costPerUnit: 800,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            },
            {
                name: 'Rice',
                unit: 'kg',
                quantity: 100,
                minLevel: 20,
                costPerUnit: 150,
                expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months
            },
            {
                name: 'Tomatoes',
                unit: 'kg',
                quantity: 25,
                minLevel: 5,
                costPerUnit: 200,
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            },
            {
                name: 'Olive Oil',
                unit: 'L',
                quantity: 15,
                minLevel: 3,
                costPerUnit: 1200,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            },
            {
                name: 'Fresh Milk',
                unit: 'L',
                quantity: 30,
                minLevel: 10,
                costPerUnit: 250,
                expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
            }
        ];

        const createdIngredients = [];
        for (const ing of ingredients) {
            const existing = await Ingredient.findOne({ name: ing.name });
            if (!existing) {
                const created = await Ingredient.create(ing);
                createdIngredients.push(created);
                console.log(`✅ Created ingredient: ${ing.name}`);
            } else {
                createdIngredients.push(existing);
                console.log(`⏭️  Ingredient exists: ${ing.name}`);
            }
        }

        // ===== TABLES (5 tables) =====
        console.log('\n🪑 Creating Tables...');
        const tables = [
            {
                tableNumber: 'T1',
                capacity: 4,
                location: 'INDOOR',
                status: 'AVAILABLE',
                position: { x: 100, y: 100 }
            },
            {
                tableNumber: 'T2',
                capacity: 2,
                location: 'WINDOW',
                status: 'AVAILABLE',
                position: { x: 200, y: 100 }
            },
            {
                tableNumber: 'T3',
                capacity: 6,
                location: 'OUTDOOR',
                status: 'AVAILABLE',
                position: { x: 100, y: 200 }
            },
            {
                tableNumber: 'T4',
                capacity: 4,
                location: 'INDOOR',
                status: 'AVAILABLE',
                position: { x: 200, y: 200 }
            },
            {
                tableNumber: 'T5',
                capacity: 8,
                location: 'BALCONY',
                status: 'AVAILABLE',
                position: { x: 300, y: 100 }
            }
        ];

        const createdTables = [];
        for (const table of tables) {
            const existing = await Table.findOne({ tableNumber: table.tableNumber });
            if (!existing) {
                const created = await Table.create(table);
                createdTables.push(created);
                console.log(`✅ Created table: ${table.tableNumber}`);
            } else {
                createdTables.push(existing);
                console.log(`⏭️  Table exists: ${table.tableNumber}`);
            }
        }

        // ===== SUPPLIERS (5 suppliers) =====
        console.log('\n🏪 Creating Suppliers...');
        const suppliers = [
            {
                name: 'Fresh Farm Suppliers',
                contactPerson: 'John Silva',
                phone: '0771234567',
                email: 'john@freshfarm.lk',
                address: '123 Galle Road, Colombo 03',
                contractStatus: 'ACTIVE',
                suppliedIngredients: [createdIngredients[0]._id] // Chicken Breast
            },
            {
                name: 'Ocean Seafood Co.',
                contactPerson: 'Mary Fernando',
                phone: '0772345678',
                email: 'mary@oceanseafood.lk',
                address: '456 Negombo Road, Negombo',
                contractStatus: 'ACTIVE',
                suppliedIngredients: [createdIngredients[2]._id] // Tomatoes
            },
            {
                name: 'Spice Garden',
                contactPerson: 'Ravi Perera',
                phone: '0773456789',
                email: 'ravi@spicegarden.lk',
                address: '789 Kandy Road, Kandy',
                contractStatus: 'ACTIVE',
                suppliedIngredients: [createdIngredients[3]._id] // Olive Oil
            },
            {
                name: 'Dairy Fresh',
                contactPerson: 'Nimal Jayasinghe',
                phone: '0774567890',
                email: 'nimal@dairyfresh.lk',
                address: '321 Nuwara Eliya Road, Nuwara Eliya',
                contractStatus: 'ACTIVE',
                suppliedIngredients: [createdIngredients[4]._id] // Fresh Milk
            },
            {
                name: 'Golden Harvest',
                contactPerson: 'Saman Kumara',
                phone: '0775678901',
                email: 'saman@goldenharvest.lk',
                address: '654 Kurunegala Road, Kurunegala',
                contractStatus: 'ACTIVE',
                suppliedIngredients: [createdIngredients[1]._id] // Rice
            }
        ];

        for (const supplier of suppliers) {
            const existing = await Supplier.findOne({ name: supplier.name });
            if (!existing) {
                await Supplier.create(supplier);
                console.log(`✅ Created supplier: ${supplier.name}`);
            } else {
                console.log(`⏭️  Supplier exists: ${supplier.name}`);
            }
        }

        // ===== ORDERS (5 orders) =====
        console.log('\n🧾 Creating Orders...');
        
        // Get some menu items for orders
        const menuItems = await MenuItem.find().limit(5);
        
        if (menuItems.length > 0 && createdTables.length > 0 && (admin || waiter)) {
            const orders = [
                {
                    orderNo: 'ORD-001',
                    tableId: createdTables[0]._id,
                    orderType: 'Dine-In',
                    staffId: waiter?._id || admin._id,
                    items: [
                        {
                            menuItemId: menuItems[0]._id,
                            name: menuItems[0].name,
                            price: menuItems[0].price,
                            qty: 2,
                            note: 'Extra spicy'
                        }
                    ],
                    subtotal: menuItems[0].price * 2,
                    tax: 0,
                    total: menuItems[0].price * 2,
                    paymentMethod: 'CASH',
                    status: 'PENDING'
                },
                {
                    orderNo: 'ORD-002',
                    tableId: createdTables[1]._id,
                    orderType: 'Dine-In',
                    staffId: waiter?._id || admin._id,
                    items: [
                        {
                            menuItemId: menuItems[1]._id,
                            name: menuItems[1].name,
                            price: menuItems[1].price,
                            qty: 1
                        }
                    ],
                    subtotal: menuItems[1].price,
                    tax: 0,
                    total: menuItems[1].price,
                    paymentMethod: 'CARD',
                    status: 'COOKING'
                },
                {
                    orderNo: 'ORD-003',
                    orderType: 'Takeaway',
                    customerName: 'Kasun Perera',
                    customerPhone: '0771111111',
                    staffId: waiter?._id || admin._id,
                    items: [
                        {
                            menuItemId: menuItems[2]._id,
                            name: menuItems[2].name,
                            price: menuItems[2].price,
                            qty: 3
                        }
                    ],
                    subtotal: menuItems[2].price * 3,
                    tax: 0,
                    total: menuItems[2].price * 3,
                    paymentMethod: 'ONLINE',
                    status: 'SERVED'
                },
                {
                    orderNo: 'ORD-004',
                    tableId: createdTables[2]._id,
                    orderType: 'Dine-In',
                    staffId: waiter?._id || admin._id,
                    items: [
                        {
                            menuItemId: menuItems[3]._id,
                            name: menuItems[3].name,
                            price: menuItems[3].price,
                            qty: 2
                        },
                        {
                            menuItemId: menuItems[4]._id,
                            name: menuItems[4].name,
                            price: menuItems[4].price,
                            qty: 1
                        }
                    ],
                    subtotal: (menuItems[3].price * 2) + menuItems[4].price,
                    tax: 0,
                    total: (menuItems[3].price * 2) + menuItems[4].price,
                    paymentMethod: 'CASH',
                    status: 'PAID'
                },
                {
                    orderNo: 'ORD-005',
                    orderType: 'Takeaway',
                    customerName: 'Nimali Silva',
                    customerPhone: '0772222222',
                    staffId: waiter?._id || admin._id,
                    items: [
                        {
                            menuItemId: menuItems[0]._id,
                            name: menuItems[0].name,
                            price: menuItems[0].price,
                            qty: 1
                        }
                    ],
                    subtotal: menuItems[0].price,
                    tax: 0,
                    total: menuItems[0].price,
                    paymentMethod: 'CARD',
                    status: 'CANCELLED'
                }
            ];

            for (const order of orders) {
                const existing = await Order.findOne({ orderNo: order.orderNo });
                if (!existing) {
                    await Order.create(order);
                    console.log(`✅ Created order: ${order.orderNo}`);
                } else {
                    console.log(`⏭️  Order exists: ${order.orderNo}`);
                }
            }
        } else {
            console.log('⚠️  Skipping orders - missing menu items, tables, or staff');
        }

        console.log('\n🎉 All sample data seeded successfully!');
        console.log('\n📊 Summary:');
        console.log('- 5 Inventory Items');
        console.log('- 5 Tables');
        console.log('- 5 Suppliers');
        console.log('- 5 Orders');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

seedAllData();
