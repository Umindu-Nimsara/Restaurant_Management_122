const express = require('express');
const {
    getCategories,
    createCategory
} = require('../controllers/menu/category.controller');
const {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getPriceHistory,
    importMenuItems,
    exportMenuItems,
    bulkDeleteMenuItems,
    bulkUpdateAvailability,
    getAnalytics
} = require('../controllers/menu/menuItem.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

// Analytics
router.route('/analytics')
    .get(getAnalytics);

// Categories
router.route('/categories')
    .get(getCategories)
    .post(protect, authorize('ADMIN'), createCategory);

// Bulk operations
router.route('/bulk')
    .delete(protect, authorize('ADMIN'), bulkDeleteMenuItems);

router.route('/bulk/availability')
    .patch(protect, authorize('ADMIN'), bulkUpdateAvailability);

// Import/Export
router.route('/import')
    .post(protect, authorize('ADMIN'), importMenuItems);

router.route('/export')
    .get(protect, exportMenuItems);

// Menu Items
router.route('/items')
    .get(getMenuItems)
    .post(protect, authorize('ADMIN'), createMenuItem);

router.route('/items/:id')
    .get(getMenuItem)
    .put(protect, authorize('ADMIN'), updateMenuItem)
    .delete(protect, authorize('ADMIN'), deleteMenuItem);

router.route('/items/:id/history')
    .get(protect, getPriceHistory);

module.exports = router;
