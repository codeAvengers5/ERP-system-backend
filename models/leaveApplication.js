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
    type: Date,
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
  
},
{ toJSON: { virtuals: true } }
);
leaveappSchema.virtual('currentStatus').get(function () {
  const currentDate = new Date();
  const { leave_date, duration } = this;
  const [value, unit] = duration.split(' ');
  const endDate = new Date(leave_date);
  if (unit === 'days') {
    endDate.setDate(leave_date.getDate() + parseInt(value));
  } else if (unit === 'weeks') {
    endDate.setDate(leave_date.getDate() + parseInt(value) * 7);
  } else if (unit === 'months') {
    endDate.setMonth(leave_date.getMonth() + parseInt(value));
  }

  return currentDate > endDate ? 'duration ended' : 'ongoing';
});
const LeaveApplication = mongoose.model("LeaveApplication", leaveappSchema);

module.exports = LeaveApplication;
