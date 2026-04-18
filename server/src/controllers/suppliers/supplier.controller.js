const Supplier = require('../../models/Supplier.model');
const Ingredient = require('../../models/Ingredient.model');
const StockMovement = require('../../models/StockMovement.model');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin
exports.getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find();
        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private/Admin
exports.getSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            data: supplier
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private/Admin
exports.createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.create(req.body);
        res.status(201).json({
            success: true,
            data: supplier
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
exports.updateSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }

        res.status(200).json({
            success: true,
            data: supplier
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
exports.deleteSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
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

// @desc    Create purchase from supplier (updates inventory)
// @route   POST /api/suppliers/:id/purchase
// @access  Private/Admin
exports.createPurchase = async (req, res, next) => {
    try {
        const { ingredientId, quantity, cost } = req.body;

        // Check supplier
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                error: 'Supplier not found'
            });
        }

        // Check ingredient
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }

        // Log stock movement
        await StockMovement.create({
            ingredientId,
            type: 'PURCHASE',
            quantity,
            cost,
            supplierId: req.params.id,
            reason: `Purchase from ${supplier.name}`,
            staffId: req.user.id
        });

        // Update ingredient quantity
        ingredient.quantity += Number(quantity);
        await ingredient.save();

        res.status(200).json({
            success: true,
            message: 'Purchase recorded and inventory updated'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get transactions for a supplier
// @route   GET /api/suppliers/:id/transactions
// @access  Private/Admin
exports.getSupplierTransactions = async (req, res, next) => {
    try {
        const transactions = await StockMovement.find({
            supplierId: req.params.id,
            type: 'PURCHASE'
        })
            .populate('ingredientId', 'name unit')
            .populate('staffId', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (err) {
        next(err);
    }
};
