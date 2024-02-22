const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  leave_id: {
    type: Number,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  leave_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
});

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;