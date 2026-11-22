const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  isEmergency: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW'],
    default: 'WAITING',
  },
  prescription: {
    symptoms: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    medicines: [
      {
        name: { type: String, default: '' },
        dosage: { type: String, default: '' },
        frequency: { type: String, default: '' },
        duration: { type: String, default: '' },
      },
    ],
    advice: { type: String, default: '' },
    issuedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Appointment', appointmentSchema);