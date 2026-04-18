const express = require('express');
const {
    getOrders,
    getOrder,
    createOrder,
    updateOrder,
    updateOrderStatus
} = require('../controllers/orders/order.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
    .get(getOrders)
    .post(authorize('ADMIN', 'WAITER', 'CUSTOMER'), createOrder);

router.route('/:id')
    .get(getOrder)
    .put(authorize('ADMIN', 'WAITER'), updateOrder);

router.route('/:id/status')
    .put(authorize('ADMIN', 'CHEF', 'WAITER'), updateOrderStatus);

module.exports = router;
