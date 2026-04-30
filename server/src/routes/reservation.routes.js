const express = require('express');
const {
    getReservations,
    getReservation,
    createReservation,
    updateReservation,
    cancelReservation,
    checkAvailability,
    deleteReservation
} = require('../controllers/reservations/reservation.controller');

const router = express.Router();

const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
    .get(getReservations)
    .post(createReservation);

router.get('/availability', checkAvailability);

router.route('/:id')
    .get(getReservation)
    .put(updateReservation)
    .delete(deleteReservation);

router.put('/:id/cancel', cancelReservation);

module.exports = router;
