const mongoose = require('mongoose');

const appointedEventSchema = new mongoose.Schema({
  appoint_id: {
    type: Number,
    required: true,
  },
  payment_id: {
    type: String,
    required: true,
  },
  no_of_ppl: {
    type: Number,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  specification: {
    type: String,
    required: true,
  },
  phone_no: {
    type: String,
    required: true,
  },
  date_of_event: {
    type: Date,
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

const AppointedEvent = mongoose.model('AppointedEvent', appointedEventSchema);

module.exports = AppointedEvent;