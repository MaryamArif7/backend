const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  visitDate: {
    type: Date,
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  treatment: {
    type: String,
  },
  prescription: [
    {
      medication: { type: String },
      dosage: { type: String },
      frequency: { type: String },
      duration: { type: String },
    },
  ],
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

MedicalRecordSchema.index({ patient: 1, visitDate: -1 });  // Index for quick retrieval of patient records

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
