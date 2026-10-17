const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  ticket_number: String,
  customer_id: String,
  subject: String,
  department: String,
  type: String,
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Open' },
  assigned_to: String,
  details: String,
  resolution_notes: String,
  csat_score: Number,
  created_at: String,
  resolved_at: String
}, { timestamps: true });

module.exports = mongoose.models.SupportTicket || mongoose.model('SupportTicket', ticketSchema);
