const mongoose = require('mongoose');

const SystemMetaSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, default: true },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.models.SystemMeta || mongoose.model('SystemMeta', SystemMetaSchema);
