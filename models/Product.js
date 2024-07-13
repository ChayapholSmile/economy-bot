const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;
