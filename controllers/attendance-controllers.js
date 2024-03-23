const Attendance = require("../models/attendance");
const EmployeeInfo = require("../models/employeeInfo");
const LeaveApplication = require("../models/leaveApplication");

async function fetchAttendance(req, res, next) {
  const { barcode } = req.body;
  try {
    const employee = await EmployeeInfo.findOne({ barcode });
    if (employee) {
      const isLeave = await LeaveApplication.findOne({
        employee_id: employee.employee_id,
      });
      if (isLeave.currentStatus === "ongoing") {
        res.json({
          message: `Leave at ${isLeave.leave_date} for${isLeave.duration}`,
        });
      }
      const attendance = await Attendance.findOne({
        employee_id: employee.employee_id,
      });

      if (!attendance) {
        const newAttendance = new Attendance({
          employee_id: employee.employee_id,
        });
        await newAttendance.checkIn();
      } else {
        await attendance.checkIn();
      }
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  } catch (error) {
    console.error("Error fetching employee info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = { fetchAttendance };
