const express = require('express');
const {
    getTables,
    getTable,
    createTable,
    updateTable,
    deleteTable
} = require('../controllers/tables/table.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/')
    .get(authorize('ADMIN', 'WAITER', 'CUSTOMER'), getTables)
    .post(authorize('ADMIN'), createTable);

router.route('/:id')
    .get(getTable)
    .put(authorize('ADMIN'), updateTable)
    .delete(authorize('ADMIN'), deleteTable);

module.exports = router;
