const Reservation = require('../../models/Reservation.model');
const Table = require('../../models/Table.model');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res, next) => {
    try {
        const reservations = await Reservation.find().populate('tableId');
        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                error: 'Reservation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private (Waiter/Admin)
// @desc    Check table availability
// @route   GET /api/reservations/availability
// @access  Private
exports.checkAvailability = async (req, res, next) => {
    try {
        const { startAt, endAt, guestCount } = req.query;

        if (!startAt || !endAt || !guestCount) {
            return res.status(400).json({
                success: false,
                error: 'Please provide startAt, endAt and guestCount'
            });
        }

        const start = new Date(startAt);
        const end = new Date(endAt);

        // Find reservations that overlap with the requested time
        const overlappingReservations = await Reservation.find({
            status: { $nin: ['CANCELLED', 'NO_SHOW'] },
            $or: [
                { startAt: { $lt: end }, endAt: { $gt: start } }
            ]
        });

        const reservedTableIds = overlappingReservations.map(res => res.tableId.toString());

        // Find available tables with sufficient capacity
        const availableTables = await Table.find({
            _id: { $nin: reservedTableIds },
            capacity: { $gte: parseInt(guestCount) },
            status: 'AVAILABLE'
        });

        res.status(200).json({
            success: true,
            count: availableTables.length,
            data: availableTables
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private (Waiter/Admin)
exports.createReservation = async (req, res, next) => {
    try {
        const { tableId, startAt, endAt, guestCount } = req.body;

        // Check if table exists and has capacity
        const table = await Table.findById(tableId);
        if (!table) {
            return res.status(404).json({ success: false, error: 'Table not found' });
        }

        if (table.capacity < guestCount) {
            return res.status(400).json({ success: false, error: 'Table capacity is smaller than guest count' });
        }

        // Check for overlapping reservations
        const start = new Date(startAt);
        const end = new Date(endAt);

        const overlap = await Reservation.findOne({
            tableId,
            status: { $nin: ['CANCELLED', 'NO_SHOW'] },
            $or: [
                { startAt: { $lt: end }, endAt: { $gt: start } }
            ]
        });

        if (overlap) {
            return res.status(400).json({ success: false, error: 'Table is already reserved for this time' });
        }

        const reservation = await Reservation.create(req.body);
        res.status(201).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                error: 'Reservation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
exports.cancelReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.id, { status: 'CANCELLED' }, {
            new: true,
            runValidators: true
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                error: 'Reservation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);

        if (!reservation) {
            return res.status(404).json({
                success: false,
                error: 'Reservation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
