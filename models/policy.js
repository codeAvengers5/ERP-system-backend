const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;