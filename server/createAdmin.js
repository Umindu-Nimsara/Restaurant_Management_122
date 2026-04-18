require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const User = require('./src/models/User.model');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@restaurant.com' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Email: admin@restaurant.com');
            console.log('Password: admin123');
            process.exit(0);
        }

        // Create admin user
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@restaurant.com',
            password: 'admin123',
            role: 'ADMIN',
            phone: '0771234567',
            isActive: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('Email: admin@restaurant.com');
        console.log('Password: admin123');

        // Create some sample users
        await User.create({
            name: 'John Waiter',
            email: 'john@restaurant.com',
            password: 'waiter123',
            role: 'WAITER',
            phone: '0771234568',
            isActive: true
        });

        await User.create({
            name: 'Chef Mike',
            email: 'chef@restaurant.com',
            password: 'chef123',
            role: 'CHEF',
            phone: '0771234569',
            isActive: true
        });

        console.log('✅ Sample users created!');
        console.log('Waiter: john@restaurant.com / waiter123');
        console.log('Chef: chef@restaurant.com / chef123');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

createAdmin();
