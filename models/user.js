const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  jobSummary: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobSummary',
  }],
  appointedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppointedEvent',
  }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;