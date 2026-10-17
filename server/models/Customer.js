const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  card_number: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  tier: { type: String, default: 'Bronze' },
  points_balance: { type: Number, default: 0 },
  lifetime_points: { type: Number, default: 0 },
  total_spent: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  last_visit: String,
  join_date: String,
  birthday: String,
  churn_risk: { type: String, default: 'Low' },
  tags: { type: [String], default: [] },
  notes: { type: String, default: '' },
  preferred_department: { type: String, default: 'খাতা, ডায়েরি ও কাগজ সামগ্রী' }
}, { timestamps: true });

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
