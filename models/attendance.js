const mongoose = require("mongoose");
const LeaveApplication = require("./leaveApplication");

const attendanceSchema = new mongoose.Schema({
  attendanceHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      check_in: {
        type: Date,
      },
      status: {
        type: String,
        enum: ["Absent", "Present", "Late", "On Leave"],
        default: "Absent",
      },
    },
  ],
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
});

attendanceSchema.virtual("status").get(async function () {
  const leaveApplication = await LeaveApplication.findOne({
    employee_id: this.employee_id,
    currentStatus: "ongoing",
  });

  if (leaveApplication) {
    return "On Leave";
  } else if (!this.check_in) {
    return "Absent";
  }

  const checkInTime = this.check_in.getHours() * 60 + this.check_in.getMinutes();
  const lateThreshold = 8 * 60 + 30; // 8:30 AM

  if (checkInTime <= lateThreshold) {
    return "Present";
  }

  return "Late";
});

attendanceSchema.methods.checkIn = function () {
  const currentDate = new Date();
  const attendanceRecord = {
    date: currentDate,
    check_in: currentDate,
    status: this.status,
  };

  this.attendanceHistory.push(attendanceRecord);
  return this.save();
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;