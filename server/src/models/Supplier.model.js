const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a supplier name'],
        unique: true,
        trim: true
    },
    contactPerson: {
        type: String,
        required: [true, 'Please add a contact person']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    address: {
        type: String
    },
    contractStatus: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    suppliedIngredients: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Ingredient'
    }],
    // New fields
    category: {
        type: String,
        enum: ['Vegetables', 'Meat', 'Dairy', 'Spices', 'Beverages', 'Seafood', 'Grains', 'Other'],
        default: 'Other'
    },
    contractExpiryDate: {
        type: Date
    },
    paymentTerms: {
        type: String,
        enum: ['Net 30', 'Net 60', 'Net 90', 'COD', 'Advance Payment', 'Other'],
        default: 'Net 30'
    },
    businessRegistrationNo: {
        type: String
    },
    vatNumber: {
        type: String
    },
    rating: {
        deliverySpeed: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        quality: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        pricing: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        }
    }
}, {
    timestamps: true
});

// Virtual for average rating
SupplierSchema.virtual('averageRating').get(function() {
    if (!this.rating) return 5;
    const { deliverySpeed, quality, communication, pricing } = this.rating;
    return ((deliverySpeed + quality + communication + pricing) / 4).toFixed(1);
});

// Ensure virtuals are included in JSON
SupplierSchema.set('toJSON', { virtuals: true });
SupplierSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Supplier', SupplierSchema);
