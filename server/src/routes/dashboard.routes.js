const express = require('express');
const { getStatistics, getRevenueAnalytics } = require('../controllers/dashboard/dashboard.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/statistics', getStatistics);
router.get('/revenue-analytics', getRevenueAnalytics);

module.exports = router;
