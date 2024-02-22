const mongoose = require('mongoose');

const jobSummarySchema = new mongoose.Schema({
  job_summary_id: {
    type: Number,
    required: true,
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPost',
    required: true,
  },
  cv: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone_no: {
    type: String,
    required: true,
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const JobSummary = mongoose.model('JobSummary', jobSummarySchema);

module.exports = JobSummary;