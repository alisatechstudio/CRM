const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  icon: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.models.Department || mongoose.model('Department', departmentSchema);
