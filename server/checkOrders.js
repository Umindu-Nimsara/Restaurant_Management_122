require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order.model');

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const orders = await Order.find();
        console.log(`📦 Found ${orders.length} orders:\n`);

        orders.forEach((order, idx) => {
            console.log(`${idx + 1}. Order #${order.orderNumber || order._id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Total: LKR ${order.total || 0}`);
            console.log(`   Items: ${order.items?.length || 0}`);
            console.log(`   Created: ${order.createdAt}\n`);
        });

        // Calculate total revenue from PAID orders
        const paidOrders = orders.filter(o => o.status === 'PAID');
        const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        console.log(`💰 Total PAID orders: ${paidOrders.length}`);
        console.log(`💰 Total Revenue: LKR ${totalRevenue}\n`);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkOrders();
