const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true },
  order_id: String,
  type: { type: String, default: 'Earned' },
  points: Number,
  balance_after: Number,
  description: String,
  created_at: String
}, { timestamps: true });

module.exports = mongoose.models.LoyaltyTransaction || mongoose.model('LoyaltyTransaction', loyaltySchema);
