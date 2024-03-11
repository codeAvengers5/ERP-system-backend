
const mongoose = require("mongoose");

const leaveappSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  full_name: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  leave_date: {
    type: String,
    required: true,
  },
  detail: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

const LeaveApplication = mongoose.model("LeaveApplication", leaveappSchema);

module.exports = LeaveApplication;
