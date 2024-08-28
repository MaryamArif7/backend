const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
  },
  location: {
    type: String,
  },
  contactNumber: {
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

DepartmentSchema.index({ name: 1 });  // Index for quick lookup

module.exports = mongoose.model('Department', DepartmentSchema);
