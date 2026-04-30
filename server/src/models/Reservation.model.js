const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Please add a customer name']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    email: {
        type: String
    },
    guestCount: {
        type: Number,
        required: [true, 'Please add the guest count']
    },
    tableId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Table',
        required: [true, 'Please add a table ID']
    },
    startAt: {
        type: Date,
        required: [true, 'Please add a start time']
    },
    endAt: {
        type: Date,
        required: [true, 'Please add an end time']
    },
    status: {
        type: String,
        enum: ['BOOKED', 'ARRIVED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
        default: 'BOOKED'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', ReservationSchema);
