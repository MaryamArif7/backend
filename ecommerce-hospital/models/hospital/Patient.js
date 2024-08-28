const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,  // Allows null but unique if not null
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    contactNumber: { type: String },
  },
  medicalHistory: [
    {
      condition: { type: String },
      diagnosisDate: { type: Date },
      treatment: { type: String },
    },
  ],
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

PatientSchema.index({ firstName: 1, lastName: 1, dateOfBirth: 1 });  // Compound index for efficient searching

module.exports = mongoose.model('Patient', PatientSchema);
