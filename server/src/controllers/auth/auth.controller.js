const User = require('../../models/User.model');
const crypto = require('crypto');
const AuditLog = require('../../models/AuditLog.model');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, phone, birthday } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role,
            phone,
            birthday
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > Date.now()) {
            const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
            return res.status(401).json({
                success: false,
                error: `Account is locked. Try again in ${minutes} minutes.`
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            // Increment failed attempts
            user.failedLoginAttempts += 1;

            // Lock account if 5 failed attempts
            if (user.failedLoginAttempts >= 5) {
                user.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
                user.failedLoginAttempts = 0; // Reset for after lock
            }

            // Record failed login
            user.loginHistory.unshift({ ip, status: 'FAILED' });
            if (user.loginHistory.length > 10) user.loginHistory.pop();

            await user.save({ validateBeforeSave: false });

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Reset failed attempts on success
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;

        // Record successful login
        user.loginHistory.unshift({ ip, status: 'SUCCESS' });
        if (user.loginHistory.length > 10) user.loginHistory.pop();

        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user via PIN
// @route   POST /api/auth/pin-login
// @access  Public
exports.pinLogin = async (req, res, next) => {
    try {
        const { pin } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        if (!pin) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a PIN'
            });
        }

        const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');

        const user = await User.findOne({ pin: hashedPin }).select('+pin');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid PIN'
            });
        }

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > Date.now()) {
            const minutes = Math.ceil((user.lockedUntil - Date.now()) / 60000);
            return res.status(401).json({
                success: false,
                error: `Account is locked. Try again in ${minutes} minutes.`
            });
        }

        // Reset failed attempts on success
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;

        // Record successful login
        user.loginHistory.unshift({ ip, status: 'SUCCESS' });
        if (user.loginHistory.length > 10) user.loginHistory.pop();

        await user.save({ validateBeforeSave: false });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/profile
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user details
// @route   PUT /api/auth/update-details
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email
        };

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        if (!(await user.matchPassword(req.body.currentPassword))) {
            return res.status(401).json({
                success: false,
                error: 'Password is incorrect'
            });
        }

        user.password = req.body.newPassword;
        await user.save();

        // Log action
        await AuditLog.create({
            user: user._id,
            action: 'PASSWORD_UPDATE',
            resource: 'USER',
            ip: req.ip || req.connection.remoteAddress
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'There is no user with that email'
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // In a real app, send email here. For now, return token in response for testing.
        res.status(200).json({
            success: true,
            data: 'Email sent',
            token: resetToken // TEMPORARY for dev testing
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resetToken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        role: user.role,
        name: user.name
    });
};
