require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./src/models/User.model');
const MenuItem = require('./src/models/MenuItem.model');
const Category = require('./src/models/Category.model');
const Ingredient = require('./src/models/Ingredient.model');
const Order = require('./src/models/Order.model');
const Reservation = require('./src/models/Reservation.model');
const Table = require('./src/models/Table.model');
const Supplier = require('./src/models/Supplier.model');
const StockMovement = require('./src/models/StockMovement.model');
const AuditLog = require('./src/models/AuditLog.model');

const checkDatabase = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        console.log('=== DATABASE DATA CHECK ===\n');

        // Check each collection
        const userCount = await User.countDocuments();
        console.log(`Users: ${userCount}`);
        if (userCount > 0) {
            const users = await User.find().select('name email role').limit(5);
            users.forEach(user => console.log(`  - ${user.name} (${user.email}) - ${user.role}`));
        }

        const categoryCount = await Category.countDocuments();
        console.log(`\nCategories: ${categoryCount}`);
        if (categoryCount > 0) {
            const categories = await Category.find().select('name').limit(10);
            categories.forEach(cat => console.log(`  - ${cat.name}`));
        }

        const menuCount = await MenuItem.countDocuments();
        console.log(`\nMenu Items: ${menuCount}`);
        if (menuCount > 0) {
            const items = await MenuItem.find().select('name price category').limit(5);
            items.forEach(item => console.log(`  - ${item.name} - LKR ${item.price}`));
        }

        const ingredientCount = await Ingredient.countDocuments();
        console.log(`\nInventory Items: ${ingredientCount}`);
        if (ingredientCount > 0) {
            const ingredients = await Ingredient.find().select('name quantity unit costPerUnit').limit(5);
            ingredients.forEach(ing => console.log(`  - ${ing.name}: ${ing.quantity} ${ing.unit} (LKR ${ing.costPerUnit}/${ing.unit})`));
        }

        const orderCount = await Order.countDocuments();
        console.log(`\nOrders: ${orderCount}`);
        if (orderCount > 0) {
            const orders = await Order.find().select('orderNumber totalAmount status').limit(5);
            orders.forEach(order => console.log(`  - Order #${order.orderNumber} - LKR ${order.totalAmount} - ${order.status}`));
        }

        const tableCount = await Table.countDocuments();
        console.log(`\nTables: ${tableCount}`);
        if (tableCount > 0) {
            const tables = await Table.find().select('tableNumber capacity status').limit(5);
            tables.forEach(table => console.log(`  - Table ${table.tableNumber} (${table.capacity} seats) - ${table.status}`));
        }

        const reservationCount = await Reservation.countDocuments();
        console.log(`\nReservations: ${reservationCount}`);

        const supplierCount = await Supplier.countDocuments();
        console.log(`\nSuppliers: ${supplierCount}`);
        if (supplierCount > 0) {
            const suppliers = await Supplier.find().select('name contactPerson').limit(5);
            suppliers.forEach(sup => console.log(`  - ${sup.name} (${sup.contactPerson})`));
        }

        const stockMovementCount = await StockMovement.countDocuments();
        console.log(`\nStock Movements: ${stockMovementCount}`);

        const auditLogCount = await AuditLog.countDocuments();
        console.log(`\nAudit Logs: ${auditLogCount}`);

        console.log('\n=== SUMMARY ===');
        const totalRecords = userCount + categoryCount + menuCount + ingredientCount + 
                           orderCount + tableCount + reservationCount + supplierCount + 
                           stockMovementCount + auditLogCount;
        console.log(`Total Records: ${totalRecords}`);
        
        if (totalRecords === 0) {
            console.log('\n⚠️  Database is EMPTY - No data found!');
        } else {
            console.log('\n✓ Database has data');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
};

checkDatabase();
