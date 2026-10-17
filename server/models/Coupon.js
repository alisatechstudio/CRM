const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  title: String,
  discount_type: { type: String, default: 'percentage' },
  discount_value: Number,
  min_spend: { type: Number, default: 0 },
  max_discount: { type: Number, default: 0 },
  target_tier: { type: String, default: 'All' },
  expiry_date: String,
  usage_limit: { type: Number, default: 100 },
  used_count: { type: Number, default: 0 },
  is_active: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
