const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a menu item name'],
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    imageUrl: {
        type: String,
        default: 'no-photo.jpg'
    },
    portionSize: {
        type: String,
        required: [true, 'Please add a portion size'],
        enum: ['Small (S)', 'Medium (M)', 'Large (L)', 'Family / Sharing', 'Kids']
    },
    availability: {
        type: String,
        enum: ['AVAILABLE', 'OUT_OF_STOCK'],
        default: 'AVAILABLE'
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        enum: ['Chef\'s Special', 'New', 'Seasonal', 'Bestseller', 'Spicy', 'Vegan']
    }],
    dynamicPricing: {
        isActive: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            enum: ['DISCOUNT', 'SURGE'],
            default: 'DISCOUNT'
        },
        percentage: {
            type: Number,
            min: 1,
            max: 100,
            default: 10
        },
        startTime: {
            type: String, // format HH:MM eg '14:00'
            default: '00:00'
        },
        endTime: {
            type: String, // format HH:MM eg '18:00'
            default: '23:59'
        },
        daysActive: [{
            type: Number, // 0 = Sunday, 1 = Monday, etc.
            enum: [0, 1, 2, 3, 4, 5, 6]
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
