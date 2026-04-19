const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an ingredient name'],
        unique: true,
        trim: true
    },
    unit: {
        type: String,
        enum: ['kg', 'g', 'L', 'ml', 'pcs'],
        required: [true, 'Please add a unit']
    },
    quantity: {
        type: Number,
        default: 0
    },
    minLevel: {
        type: Number,
        required: [true, 'Please add a minimum level for alerts']
    },
    costPerUnit: {
        type: Number,
        default: 0
    },
    expiryDate: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ingredient', IngredientSchema);
