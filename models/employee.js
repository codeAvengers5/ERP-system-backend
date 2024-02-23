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
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;