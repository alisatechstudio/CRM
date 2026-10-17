const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  channel: String,
  target_segment: String,
  subject: String,
  content: String,
  coupon_code: String,
  status: { type: String, default: 'Draft' },
  audience_count: { type: Number, default: 0 },
  open_rate: { type: Number, default: 0 },
  click_rate: { type: Number, default: 0 },
  conversion_rate: { type: Number, default: 0 },
  revenue_generated: { type: Number, default: 0 },
  scheduled_at: String,
  sent_at: String
}, { timestamps: true });

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
