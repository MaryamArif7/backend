const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true,  // Adding an index for faster search
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  images: [
    {
      url: { type: String, required: true },
      altText: { type: String },
    },
  ],
  attributes: {
    type: Map,
    of: String,  // Can be expanded to accommodate different types if needed
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 0, max: 5 },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

ProductSchema.index({ name: 1, price: 1 });  // Compound index for efficient filtering

module.exports = mongoose.model('Product', ProductSchema);
