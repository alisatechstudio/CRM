const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    default: 'অন্যান্য বিবিধ খরচ' 
  },
  amount: { type: Number, required: true, min: 0 },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  payment_method: { type: String, default: 'নগদ (Cash)' },
  notes: { type: String, default: '' },
  store_id: { type: String, default: 'store_1' },
  created_by: { type: String, default: 'মিজানুর রহমান' }
}, { timestamps: true });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
