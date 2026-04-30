const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
    tableNumber: {
        type: String,
        required: [true, 'Please add a table number'],
        unique: true
    },
    capacity: {
        type: Number,
        required: [true, 'Please add table capacity']
    },
    location: {
        type: String,
        enum: ['INDOOR', 'OUTDOOR', 'WINDOW', 'BALCONY'],
        default: 'INDOOR'
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
        default: 'AVAILABLE'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Table', TableSchema);
