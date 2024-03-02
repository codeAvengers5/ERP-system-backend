const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  role_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  },
  email: {
    type: String,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  // manager: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Employee'
  // },
  enable2fa: {
    type: Boolean,
    required: false,
    default: false
  },
  secrets2fa: {
    type: String,
    required: false,
  }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;