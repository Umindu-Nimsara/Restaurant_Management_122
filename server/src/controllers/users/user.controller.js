const User = require('../../models/User.model');
const AuditLog = require('../../models/AuditLog.model');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Activate/Deactivate user
// @route   PUT /api/users/:id/activate or /api/users/:id/deactivate
// @access  Private/Admin
exports.setUserStatus = async (req, res, next) => {
    try {
        const isActive = req.path.includes('activate') && !req.path.includes('deactivate');
        const user = await User.findByIdAndUpdate(req.params.id, { isActive }, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Log action
        await AuditLog.create({
            user: req.user.id,
            action: isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
            resource: `USER:${user._id}`,
            ip: req.ip || req.connection.remoteAddress
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Unlock user
// @route   PUT /api/users/:id/unlock
// @access  Private/Admin
exports.unlockUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, {
            lockedUntil: undefined,
            failedLoginAttempts: 0
        }, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Log action
        await AuditLog.create({
            user: req.user.id,
            action: 'USER_UNLOCK',
            resource: `USER:${user._id}`,
            ip: req.ip || req.connection.remoteAddress
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own admin account'
            });
        }

        await user.deleteOne();

        // Log action
        await AuditLog.create({
            user: req.user.id,
            action: 'USER_DELETE',
            resource: `USER:${user.email}`,
            ip: req.ip || req.connection.remoteAddress
        });

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all audit logs
// @route   GET /api/users/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res, next) => {
    try {
        const logs = await AuditLog.find().populate('user', 'name email role').sort('-createdAt').limit(100);
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current user's login history
// @route   GET /api/users/login-history
// @access  Private
exports.getLoginHistory = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('loginHistory');
        res.status(200).json({
            success: true,
            data: user.loginHistory
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Assign or Reset PIN
// @route   PUT /api/users/:id/pin
// @access  Private/Admin
exports.setPin = async (req, res, next) => {
    try {
        const { pin } = req.body;
        
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid 4-digit numeric PIN'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        user.pin = pin; // Pre-save hook will hash it automatically
        await user.save({ validateBeforeSave: false });

        // Log action
        await AuditLog.create({
            user: req.user.id,
            action: 'USER_PIN_UPDATE',
            resource: `USER:${user._id}`,
            ip: req.ip || req.connection.remoteAddress
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'This PIN is currently in use by another staff member'
            });
        }
        next(err);
    }
};
