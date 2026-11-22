const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  roomNumber: { type: String, required: true },
  avgConsultationMinutes: { type: Number, default: 10 },
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Doctor', doctorSchema);
