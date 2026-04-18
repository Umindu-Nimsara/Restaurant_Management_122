const StockMovement = require('../../models/StockMovement.model');
const Ingredient = require('../../models/Ingredient.model');

// @desc    Add stock movement
// @route   POST /api/inventory/stock
// @access  Private/Admin
exports.addStockMovement = async (req, res, next) => {
    try {
        const { ingredientId, type, quantity, reason } = req.body;

        // Create movement
        const movement = await StockMovement.create({
            ingredientId,
            type,
            quantity,
            reason,
            staffId: req.user.id
        });

        // Update ingredient quantity
        const ingredient = await Ingredient.findById(ingredientId);
        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }

        if (type === 'PURCHASE') {
            ingredient.quantity += Number(quantity);
        } else if (type === 'USAGE' || type === 'WASTE') {
            ingredient.quantity -= Number(quantity);
        } else if (type === 'ADJUSTMENT') {
            ingredient.quantity += Number(quantity);
        }

        await ingredient.save();

        res.status(201).json({
            success: true,
            data: movement
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get stock movements for an ingredient
// @route   GET /api/inventory/stock/:ingredientId
// @access  Private/Admin
exports.getIngredientStockMovements = async (req, res, next) => {
    try {
        const movements = await StockMovement.find({ ingredientId: req.params.ingredientId }).populate('staffId', 'name');
        res.status(200).json({
            success: true,
            count: movements.length,
            data: movements
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all stock movements
// @route   GET /api/inventory/stock
// @access  Private/Admin
exports.getStockMovements = async (req, res, next) => {
    try {
        const movements = await StockMovement.find()
            .populate('ingredientId', 'name')
            .populate('staffId', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: movements.length,
            data: movements
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Get usage analytics for charts
// @route   GET /api/inventory/analytics
// @access  Private/Admin
exports.getUsageAnalytics = async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));

        // Get all USAGE movements in the date range
        const movements = await StockMovement.find({
            type: 'USAGE',
            createdAt: { $gte: daysAgo }
        }).populate('ingredientId', 'name unit');

        // Get all ingredients
        const ingredients = await Ingredient.find();

        // Generate date labels
        const labels = [];
        for (let i = parseInt(days) - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        // Group by ingredient and date
        const ingredientMap = {};
        movements.forEach(mov => {
            if (!mov.ingredientId) return;
            
            const ingName = mov.ingredientId.name;
            const dateStr = new Date(mov.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (!ingredientMap[ingName]) {
                ingredientMap[ingName] = {};
            }
            if (!ingredientMap[ingName][dateStr]) {
                ingredientMap[ingName][dateStr] = 0;
            }
            ingredientMap[ingName][dateStr] += mov.quantity;
        });

        // Build line chart datasets
        const ingredientColors = {
            'Chicken Breast': '#4CAF50',
            'Rice': '#FFC107',
            'Tomatoes': '#F44336',
            'Olive Oil': '#009688',
            'Fresh Milk': '#3F51B5',
            'cardamom': '#9C27B0'
        };
        const defaultColors = ['#4CAF50', '#FFC107', '#F44336', '#009688', '#3F51B5', '#9C27B0', '#06b6d4'];
        
        const lineDatasets = Object.keys(ingredientMap).slice(0, 7).map((ingName, idx) => {
            const data = labels.map(label => ingredientMap[ingName][label] || 0);
            const color = ingredientColors[ingName] || defaultColors[idx % defaultColors.length];
            return {
                label: ingName,
                data: data.map(v => parseFloat(v.toFixed(2))),
                backgroundColor: color,
                borderColor: color,
                borderWidth: 0
            };
        });

        // Calculate total usage per ingredient for pie chart
        const totalUsage = {};
        movements.forEach(mov => {
            if (!mov.ingredientId) return;
            const ingName = mov.ingredientId.name;
            if (!totalUsage[ingName]) totalUsage[ingName] = 0;
            totalUsage[ingName] += mov.quantity;
        });

        const sortedIngredients = Object.entries(totalUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const pieColorMap = {
            'Rice': '#1ABC9C',
            'Chicken Breast': '#F39C12',
            'Fresh Milk': '#E74C3C',
            'Tomatoes': '#2ECC71',
            'cardamom': '#9B59B6'
        };
        const defaultPieColors = ['#1ABC9C', '#F39C12', '#E74C3C', '#2ECC71', '#9B59B6'];

        const totalSum = sortedIngredients.reduce((sum, [, qty]) => sum + qty, 0);
        const pieLabels = sortedIngredients.map(([name]) => name);
        const pieData = sortedIngredients.map(([, qty]) => parseFloat(qty.toFixed(2)));
        const pieColors = sortedIngredients.map(([name], idx) => pieColorMap[name] || defaultPieColors[idx % defaultPieColors.length]);

        // Calculate weekly data for bar chart
        const weeksAgo = Math.ceil(parseInt(days) / 7);
        const weekLabels = [];
        const weekData = {};

        for (let w = weeksAgo - 1; w >= 0; w--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            weekLabels.push(`Week ${weeksAgo - w}`);
            
            Object.keys(ingredientMap).forEach(ingName => {
                if (!weekData[ingName]) weekData[ingName] = [];
                let weekTotal = 0;
                
                for (let d = 0; d < 7; d++) {
                    const checkDate = new Date(weekStart);
                    checkDate.setDate(checkDate.getDate() + d);
                    const dateStr = checkDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    weekTotal += ingredientMap[ingName][dateStr] || 0;
                }
                
                weekData[ingName].push(parseFloat(weekTotal.toFixed(2)));
            });
        }

        const barDatasets = Object.keys(weekData).slice(0, 5).map((ingName, idx) => {
            const color = ingredientColors[ingName] || defaultColors[idx % defaultColors.length];
            return {
                label: ingName,
                data: weekData[ingName],
                backgroundColor: color
            };
        });

        // Calculate stats
        const totalUsageSum = Object.values(totalUsage).reduce((sum, qty) => sum + qty, 0);
        const mostUsed = sortedIngredients.length > 0 ? sortedIngredients[0] : ['N/A', 0];
        const avgDaily = totalUsageSum / parseInt(days);

        res.status(200).json({
            success: true,
            data: {
                lineChart: {
                    labels,
                    datasets: lineDatasets
                },
                barChart: {
                    labels: weekLabels,
                    datasets: barDatasets
                },
                pieChart: {
                    labels: pieLabels,
                    datasets: [{
                        data: pieData,
                        backgroundColor: pieColors,
                        borderColor: '#1e293b',
                        borderWidth: 2
                    }]
                },
                stats: {
                    totalUsage: parseFloat(totalUsageSum.toFixed(2)),
                    mostUsed: mostUsed[0],
                    mostUsedQty: parseFloat(mostUsed[1].toFixed(2)),
                    mostUsedPercent: sortedIngredients.length > 0 ? parseFloat(((mostUsed[1] / totalUsageSum) * 100).toFixed(2)) : 0,
                    avgDaily: parseFloat(avgDaily.toFixed(2))
                }
            }
        });
    } catch (err) {
        console.error('Analytics error:', err);
        next(err);
    }
};

// @desc    Update stock movement
// @route   PUT /api/inventory/stock/:id
// @access  Private/Admin
exports.updateStockMovement = async (req, res, next) => {
    try {
        const { quantity, date } = req.body;
        const movement = await StockMovement.findById(req.params.id);

        if (!movement) {
            return res.status(404).json({
                success: false,
                error: 'Stock movement not found'
            });
        }

        // Calculate the difference to adjust ingredient quantity
        const oldQuantity = movement.quantity;
        const newQuantity = Number(quantity);
        const difference = newQuantity - oldQuantity;

        // Update ingredient quantity
        const ingredient = await Ingredient.findById(movement.ingredientId);
        if (ingredient) {
            if (movement.type === 'PURCHASE') {
                ingredient.quantity += difference;
            } else if (movement.type === 'USAGE' || movement.type === 'WASTE') {
                ingredient.quantity -= difference;
            } else if (movement.type === 'ADJUSTMENT') {
                ingredient.quantity += difference;
            }
            await ingredient.save();
        }

        // Update movement
        movement.quantity = newQuantity;
        if (date) movement.createdAt = new Date(date);
        await movement.save();

        res.status(200).json({
            success: true,
            data: movement
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete stock movement
// @route   DELETE /api/inventory/stock/:id
// @access  Private/Admin
exports.deleteStockMovement = async (req, res, next) => {
    try {
        const movement = await StockMovement.findById(req.params.id);

        if (!movement) {
            return res.status(404).json({
                success: false,
                error: 'Stock movement not found'
            });
        }

        // Reverse the quantity change in ingredient
        const ingredient = await Ingredient.findById(movement.ingredientId);
        if (ingredient) {
            if (movement.type === 'PURCHASE') {
                ingredient.quantity -= movement.quantity;
            } else if (movement.type === 'USAGE' || movement.type === 'WASTE') {
                ingredient.quantity += movement.quantity;
            } else if (movement.type === 'ADJUSTMENT') {
                ingredient.quantity -= movement.quantity;
            }
            await ingredient.save();
        }

        await movement.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
