const mongoose = require('mongoose');

const dueTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true },
  order_id: { type: String, default: null },
  order_number: { type: String, default: '' },
  type: { type: String, required: true }, // 'New_Due' (বিক্রয়ে বাকি সৃষ্টি) or 'Payment' (বাকি পরিশোধ জমা)
  amount: { type: Number, required: true },
  previous_due: { type: Number, default: 0 },
  remaining_due: { type: Number, default: 0 },
  payment_method: { type: String, default: 'নগদ (Cash)' },
  notes: { type: String, default: '' },
  collected_by: { type: String, default: 'মিজানুর রহমান' },
  date: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.models.DueTransaction || mongoose.model('DueTransaction', dueTransactionSchema);
