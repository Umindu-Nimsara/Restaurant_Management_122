const MenuItem = require('../../models/MenuItem.model');

// Helper to calculate effective price based on dynamic rules
const applyDynamicPricing = (doc) => {
    const item = doc.toObject();
    item.originalPrice = item.price;
    item.effectivePrice = item.price;

    if (item.dynamicPricing && item.dynamicPricing.isActive) {
        const now = new Date();
        const currentDay = now.getDay();
        
        if (item.dynamicPricing.daysActive && item.dynamicPricing.daysActive.includes(currentDay)) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            
            if (currentTimeStr >= item.dynamicPricing.startTime && currentTimeStr <= item.dynamicPricing.endTime) {
                const percentage = item.dynamicPricing.percentage || 0;
                if (item.dynamicPricing.type === 'DISCOUNT') {
                    item.effectivePrice = item.price * (1 - (percentage / 100));
                } else if (item.dynamicPricing.type === 'SURGE') {
                    item.effectivePrice = item.price * (1 + (percentage / 100));
                }
            }
        }
    }
    
    item.effectivePrice = parseFloat(item.effectivePrice.toFixed(2));
    return item;
};

// @desc    Get all menu items
// @route   GET /api/menu/items
// @access  Public
exports.getMenuItems = async (req, res, next) => {
    try {
        const items = await MenuItem.find().populate('categoryId', 'name');
        
        const pricedItems = items.map(applyDynamicPricing);

        res.status(200).json({
            success: true,
            count: pricedItems.length,
            data: pricedItems
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/items/:id
// @access  Public
exports.getMenuItem = async (req, res, next) => {
    try {
        const item = await MenuItem.findById(req.params.id).populate('categoryId', 'name');

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: applyDynamicPricing(item)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create menu item
// @route   POST /api/menu/items
// @access  Private/Admin
exports.createMenuItem = async (req, res, next) => {
    try {
        const item = await MenuItem.create(req.body);
        res.status(201).json({
            success: true,
            data: applyDynamicPricing(item)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/items/:id
// @access  Private/Admin
exports.updateMenuItem = async (req, res, next) => {
    try {
        const oldItem = await MenuItem.findById(req.params.id);
        
        if (!oldItem) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
            });
        }

        // Check if price changed
        if (req.body.price && req.body.price !== oldItem.price) {
            const PriceHistory = require('../../models/PriceHistory.model');
            
            await PriceHistory.create({
                itemId: oldItem._id,
                itemName: oldItem.name,
                oldPrice: oldItem.price,
                newPrice: req.body.price,
                changedBy: req.user.id
            });
        }

        const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: applyDynamicPricing(item)
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/items/:id
// @access  Private/Admin
exports.deleteMenuItem = async (req, res, next) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Menu item not found'
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

// @desc    Get price history for menu item
// @route   GET /api/menu/items/:id/history
// @access  Private
exports.getPriceHistory = async (req, res, next) => {
    try {
        const PriceHistory = require('../../models/PriceHistory.model');
        
        const history = await PriceHistory.find({ itemId: req.params.id })
            .populate('changedBy', 'name email')
            .sort({ changedAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Import menu items from CSV
// @route   POST /api/menu/import
// @access  Private/Admin
exports.importMenuItems = async (req, res, next) => {
    try {
        const multer = require('multer');
        const csv = require('csv-parser');
        const fs = require('fs');
        const path = require('path');
        
        // Setup multer for file upload
        const upload = multer({ dest: 'uploads/' });
        
        // This would need proper middleware setup
        // For now, return a placeholder response
        res.status(200).json({
            success: true,
            message: 'Import endpoint ready - requires file upload middleware',
            imported: 0,
            failed: 0,
            errors: []
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Export menu items to CSV
// @route   GET /api/menu/export
// @access  Private
exports.exportMenuItems = async (req, res, next) => {
    try {
        const items = await MenuItem.find().populate('categoryId', 'name');
        
        // Create CSV content
        const csvHeader = 'Name,Price,Category,Portion Size,Tags,Description,Availability\n';
        const csvRows = items.map(item => {
            const tags = (item.tags || []).join(';');
            const description = (item.description || '').replace(/,/g, ';').replace(/\n/g, ' ');
            return `"${item.name}",${item.price},"${item.categoryId?.name || ''}","${item.portionSize}","${tags}","${description}",${item.availability}`;
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=menu_export.csv');
        res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
};

// @desc    Bulk delete menu items
// @route   DELETE /api/menu/bulk
// @access  Private/Admin
exports.bulkDeleteMenuItems = async (req, res, next) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of item IDs'
            });
        }

        const result = await MenuItem.deleteMany({ _id: { $in: ids } });

        res.status(200).json({
            success: true,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Bulk update availability
// @route   PATCH /api/menu/bulk/availability
// @access  Private/Admin
exports.bulkUpdateAvailability = async (req, res, next) => {
    try {
        const { ids, availability } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of item IDs'
            });
        }

        if (!['AVAILABLE', 'OUT_OF_STOCK'].includes(availability)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid availability status'
            });
        }

        const result = await MenuItem.updateMany(
            { _id: { $in: ids } },
            { $set: { availability } }
        );

        res.status(200).json({
            success: true,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Get menu analytics
// @route   GET /api/menu/analytics
// @access  Public
exports.getAnalytics = async (req, res, next) => {
    try {
        const Category = require('../../models/Category.model');
        
        // Total items
        const totalItems = await MenuItem.countDocuments();
        
        // Available items
        const availableItems = await MenuItem.countDocuments({ 
            availability: { $ne: 'OUT_OF_STOCK' } 
        });
        
        // Out of stock
        const outOfStock = await MenuItem.countDocuments({ 
            availability: 'OUT_OF_STOCK' 
        });
        
        // Categories count
        const categoriesCount = await Category.countDocuments();
        
        // Total menu value (sum of all prices)
        const totalValueResult = await MenuItem.aggregate([
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);
        const totalValue = totalValueResult[0]?.total || 0;
        
        // Available percentage
        const availablePercent = totalItems > 0 ? Math.round((availableItems / totalItems) * 100) : 0;
        
        // Most expensive item
        const mostExpensiveItem = await MenuItem.findOne().sort({ price: -1 }).limit(1);
        const mostExpensive = mostExpensiveItem ? {
            name: mostExpensiveItem.name,
            price: mostExpensiveItem.price
        } : null;
        
        // Items per category
        const itemsPerCategory = await MenuItem.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category.name',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Availability ratio
        const availabilityRatio = {
            available: availableItems,
            unavailable: outOfStock
        };
        
        // Items per tag
        const itemsPerTag = await MenuItem.aggregate([
            { $unwind: '$tags' },
            {
                $group: {
                    _id: '$tags',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    tag: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totalItems,
                availableItems,
                outOfStock,
                categoriesCount,
                totalValue,
                availablePercent,
                mostExpensive,
                itemsPerCategory,
                availabilityRatio,
                itemsPerTag
            }
        });
    } catch (err) {
        next(err);
    }
};
