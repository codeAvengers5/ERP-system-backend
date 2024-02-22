const mongoose = require('mongoose');

const employeeInfoSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  phone_no: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  address: {
    city: {
      type: String,
      required: true,
    },
    sub_city: {
      type: String,
      required: true,
    },
    woreda: {
      type: String,
      required: true,
    },
  },
});

const EmployeeInfo = mongoose.model('EmployeeInfo', employeeInfoSchema);

module.exports = EmployeeInfo;