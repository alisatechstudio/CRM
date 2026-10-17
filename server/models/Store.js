const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  location: { type: String, required: true },
  phone: String,
  manager: String,
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.models.Store || mongoose.model('Store', storeSchema);
