const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
  job_id: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirement: {
    type: String,
    required: true,
  },
  responsibility: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
});

const JobPost = mongoose.model('JobPost', jobPostSchema);

module.exports = JobPost;