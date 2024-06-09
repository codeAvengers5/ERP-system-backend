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
        enum: ["Absent", "Present", "Late", "On Leave","Weekend/Holiday"],
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
  try {
    const leaveApplication = await LeaveApplication.findOne({
      employee_id: this.employee_id,
    });
   
  if (leaveApplication) {
    if(leaveApplication.currentStatus === "ongoing"){
    const currentDate = new Date();
    const attendanceRecord = {
      date: currentDate,
      check_in: null,
      status: "On Leave",
    };
    
    this.attendanceHistory.push(attendanceRecord);
    await this.save();
    return "On Leave";}
  } 
  else if (!this.attendanceHistory.length) {
    const currentDate = new Date();
    const attendanceRecord = {
      date: currentDate,
      check_in: null,
      status: "Absent",
    };
    this.attendanceHistory.push(attendanceRecord);
    await this.save();
    return "Absent";
  }

  const latestAttendance = this.attendanceHistory[this.attendanceHistory.length - 1];
  console.log(latestAttendance.check_in);
  if (!latestAttendance.check_in) {
    const currentDate = new Date();
    const attendanceRecord = {
      date: currentDate,
      check_in: null,
      status: "Absent",
    };
    this.attendanceHistory.push(attendanceRecord);
    await this.save();
    return "Absent";
  }

  const checkInTime = latestAttendance.check_in.getHours() * 60 + latestAttendance.check_in.getMinutes();
  const lateThreshold = new Date();
  lateThreshold.setHours(20, 30, 0, 0);
  console.log(checkInTime, lateThreshold)
  if (checkInTime <= lateThreshold.getHours() * 60 + lateThreshold.getMinutes()) {
    return "Present";
  }

  return "Late";
  } catch (error) {
    console.error("Error fetching leave application:", error);
    throw error;
  }
});

attendanceSchema.methods.checkIn = async function () {
  const currentDate = new Date();
  const attendanceRecord = {
    date: currentDate,
    check_in: currentDate,
    status: await this.status,
  };

  this.attendanceHistory.push(attendanceRecord);
  return this.save();
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;