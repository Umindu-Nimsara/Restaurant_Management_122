const mongoose = require('mongoose');

const StockMovementSchema = new mongoose.Schema({
    ingredientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    type: {
        type: String,
        enum: ['PURCHASE', 'USAGE', 'WASTE', 'ADJUSTMENT'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    reason: {
        type: String
    },
    staffId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    supplierId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Supplier'
    },
    cost: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StockMovement', StockMovementSchema);
