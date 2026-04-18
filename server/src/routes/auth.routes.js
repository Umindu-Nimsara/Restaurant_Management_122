const express = require('express');
const {
    register,
    login,
    getMe,
    updateDetails,
    updatePassword,
    forgotPassword,
    resetPassword,
    pinLogin
} = require('../controllers/auth/auth.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth.middleware');

// Staff registration (Admin only)
router.post('/register', protect, authorize('ADMIN'), register);
router.post('/customer-register', register); // Public customer registration
router.post('/login', login);
router.post('/pin-login', pinLogin);
router.get('/profile', protect, getMe);
router.put('/update-details', protect, updateDetails);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

module.exports = router;
