const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderNo: {
        type: String,
        unique: true
    },
    tableId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Table',
        required: false // Optional for Takeaway orders
    },
    orderType: {
        type: String,
        enum: ['Dine-In', 'Takeaway'],
        default: 'Dine-In'
    },
    customerName: {
        type: String
    },
    customerPhone: {
        type: String
    },
    staffId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            menuItemId: {
                type: mongoose.Schema.ObjectId,
                ref: 'MenuItem',
                required: true
            },
            name: String,
            price: Number,
            qty: {
                type: Number,
                required: true,
                default: 1
            },
            note: String
        }
    ],
    subtotal: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COOKING', 'SERVED', 'PAID', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['CASH', 'CARD', 'ONLINE'],
        default: 'CASH'
    },
    notes: String
}, {
    timestamps: true
});

// Auto-generate order number
OrderSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(100 + Math.random() * 900);
        this.orderNo = `ORD-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Order', OrderSchema);
