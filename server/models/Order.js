const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id: String,
  product_id: String,
  product_name: String,
  department_name: String,
  unit_price: Number,
  quantity: Number,
  total_price: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  order_number: { type: String, required: true, unique: true },
  customer_id: String,
  store_id: { type: String, default: 'store_1' },
  cashier_name: { type: String, default: 'মিজানুর রহমান' },
  subtotal: { type: Number, required: true },
  discount_amount: { type: Number, default: 0 },
  manual_discount: { type: Number, default: 0 },
  manual_discount_reason: { type: String, default: '' },
  points_redeemed: { type: Number, default: 0 },
  points_discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  due_amount: { type: Number, default: 0 },
  change_amount: { type: Number, default: 0 },
  payment_status: { type: String, default: 'Paid' },
  payment_method: { type: String, default: 'নগদ (Cash)' },
  status: { type: String, default: 'Completed' },
  created_at: { type: String, required: true },
  items: [orderItemSchema]
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
