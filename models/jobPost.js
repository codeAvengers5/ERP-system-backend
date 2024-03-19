const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
  {
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
    closingDate: {
      type: Date,
      required: true,
    },
  },
  { toJSON: { virtuals: true } }
);

// Create a virtual property to dynamically calculate the status based on the closing date
jobPostSchema.virtual('currentStatus').get(function () {
  const currentDate = new Date();
  return currentDate > this.closingDate ? 'closed' : 'open';
});

const JobPost = mongoose.model('JobPost', jobPostSchema);

module.exports = JobPost;