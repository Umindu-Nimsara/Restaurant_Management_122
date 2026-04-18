const mongoose = require('mongoose');
// const slugify = require('slugify'); // Removed as it was not being used and not installed

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true
    },
    slug: String
}, {
    timestamps: true
});

// Create category slug from the name
CategorySchema.pre('save', function (next) {
    this.slug = this.name.toLowerCase().split(' ').join('-');
    next();
});

module.exports = mongoose.model('Category', CategorySchema);
