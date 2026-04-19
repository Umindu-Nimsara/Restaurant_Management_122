require("dotenv").config();
console.log("MONGO_URI =", process.env.MONGO_URI);

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/error.middleware');
const setupSwagger = require('./src/config/swagger');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Setup Swagger
setupSwagger(app);

// Routes
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/menu', require('./src/routes/menu.routes'));
app.use('/api/inventory', require('./src/routes/inventory.routes'));
app.use('/api/orders', require('./src/routes/order.routes'));
app.use('/api/reservations', require('./src/routes/reservation.routes'));
app.use('/api/tables', require('./src/routes/table.routes'));
app.use('/api/suppliers', require('./src/routes/supplier.routes'));
app.use('/api/dashboard', require('./src/routes/dashboard.routes'));

app.get('/', (req, res) => {
    res.json({ message: 'Restaurant Management System API' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('OceanBreeze Database Connected Successfully')
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
