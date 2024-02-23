const mongoose = require("mongoose");

const employeeInfoSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    unique: true,
  },
  start_date: {
    type: Date,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  phone_no: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
    required: true,
  },
  images: {
    type: Array,
    required: true,
  },
  image_profile:{
    type:String,
  },
  maritalstatus: {
    type: String,
  },
  address: {
    city: {
      type: String,
    },
    sub_city: {
      type: String,
    },
    woreda: {
      type: String,
    },
  },
});

const EmployeeInfo = mongoose.model("EmployeeInfo", employeeInfoSchema);

module.exports = EmployeeInfo;
