const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
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
  status: {
    type: Boolean,
    default: true,
  },
  closingDate: {
    type: Date,
    required: true,
  },
});
jobPostSchema.pre('save', function (next) {
  const currentDate = new Date();
  if (currentDate > this.closingDate) {
    this.status = false; // Close the job post if the current date is after the closing date
  }
  next();
});

const JobPost = mongoose.model('JobPost', jobPostSchema);

module.exports = JobPost;