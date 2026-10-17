const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  barcode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department_id: { type: String, required: true },
  category: { type: String, default: 'সাধারণ স্টেশনারি' },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  stock_qty: { type: Number, default: 0 },
  min_threshold: { type: Number, default: 10 },
  unit: { type: String, default: 'পিস' },
  expiry_date: { type: String, default: null },
  has_expiry: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
