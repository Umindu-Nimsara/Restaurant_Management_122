const express = require('express');
const {
    getUsers,
    getUser,
    updateUser,
    setUserStatus,
    getAuditLogs,
    getLoginHistory,
    unlockUser,
    deleteUser,
    setPin
} = require('../controllers/users/user.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

// Accessible to any authenticated user
router.get('/login-history', getLoginHistory);

// Admin-only routes
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.get('/audit-logs', getAuditLogs);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/activate', setUserStatus);
router.put('/:id/deactivate', setUserStatus);
router.put('/:id/unlock', unlockUser);
router.put('/:id/pin', setPin);
router.delete('/:id', deleteUser);

module.exports = router;
