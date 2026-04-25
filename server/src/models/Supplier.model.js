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
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', SupplierSchema);
