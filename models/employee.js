const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
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
    default: "12345678",
  },
  enable2fa: {
    type: Boolean,
    required: false,
    default: false,
  },
  is2faVerified: {
    type: Boolean,
    default: false,
  },
  secrets2fa: {
    type: String,
    required: false,
  },
 
});
const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
