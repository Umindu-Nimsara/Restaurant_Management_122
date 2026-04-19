const Ingredient = require('../../models/Ingredient.model');

// @desc    Get all ingredients
// @route   GET /api/inventory/ingredients
// @access  Private/Admin
exports.getIngredients = async (req, res, next) => {
    try {
        const ingredients = await Ingredient.find();
        res.status(200).json({
            success: true,
            count: ingredients.length,
            data: ingredients
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create ingredient
// @route   POST /api/inventory/ingredients
// @access  Private/Admin
exports.createIngredient = async (req, res, next) => {
    try {
        const ingredient = await Ingredient.create(req.body);
        res.status(201).json({
            success: true,
            data: ingredient
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update ingredient
// @route   PUT /api/inventory/ingredients/:id
// @access  Private/Admin
exports.updateIngredient = async (req, res, next) => {
    try {
        const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
            });
        }

        res.status(200).json({
            success: true,
            data: ingredient
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete ingredient
// @route   DELETE /api/inventory/ingredients/:id
// @access  Private/Admin
exports.deleteIngredient = async (req, res, next) => {
    try {
        const ingredient = await Ingredient.findByIdAndDelete(req.params.id);

        if (!ingredient) {
            return res.status(404).json({
                success: false,
                error: 'Ingredient not found'
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
