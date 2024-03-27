const Attendance = require("../models/attendance");
const Employee = require("../models/employee");
const EmployeeInfo = require("../models/employeeInfo");

async function fetchAttendance(req, res, next) {
  const { barcode } = req.body;
  try {
    const employee = await EmployeeInfo.findOne({ barcode });
    if (employee) {
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
async function searchEmployee(req, res) {
  const { name } = req.query;
  try {
    const employee = await Employee.findOne({ full_name: name });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const E_id = employee._id;
    const attendanceInfo = await Attendance.findOne({ employee_id: E_id });
    if (!attendanceInfo) {
      return res
        .status(404)
        .json({ error: "No attendance info found for this employee" });
    }
    return res.status(200).json({
      attendanceInfo: attendanceInfo,
    });
  } catch (error) {
    console.error("Error searching employee:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function filterEmployeesByStatus(req, res) {
  const { status } = req.query;
  try {
    const attendanceInfo = await Attendance.find();

    const filteredAttendance = attendanceInfo.filter((attendance) => {
      return attendance.attendanceHistory.some((entry) => {
        return entry.status === status;
      });
    });

    if (filteredAttendance.length === 0) {
      return res.status(404).json({
        error: "No attendance info found for employees with this status",
      });
    }

    const attendanceWithEmployeeInfo = await Promise.all(
      filteredAttendance.map(async (attendance) => {
        const employee = await Employee.findById(attendance.employee_id);
        return {
          name: employee.full_name,
          email: employee.email,
          date: attendance.attendanceHistory[0].date,
          check_in: attendance.attendanceHistory[0].check_in,
          status: attendance.attendanceHistory[0].status,
        };
      })
    );

    return res.status(200).json({
      attendanceInfo: attendanceWithEmployeeInfo,
    });
  } catch (error) {
    console.error("Error filtering employees by status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function filterEmployeesByDate(req, res) {
  const { date } = req.query;
  try {
    const filterDate = new Date(date);
    const attendanceInfo = await Attendance.find();
    const filteredAttendance = attendanceInfo.filter((attendance) => {
      return attendance.attendanceHistory.some((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === filterDate.toDateString();
      });
    });

    if (filteredAttendance.length === 0) {
      return res
        .status(404)
        .json({ error: "No attendance info found for employees on this date" });
    }

    const attendanceWithEmployeeInfo = await Promise.all(
      filteredAttendance.map(async (attendance) => {
        const employee = await Employee.findById(attendance.employee_id);
        return {
          name: employee.full_name,
          email: employee.email,
          date: attendance.attendanceHistory[0].date,
          check_in: attendance.attendanceHistory[0].check_in,
          status: attendance.attendanceHistory[0].status,
        };
      })
    );

    return res.status(200).json({
      attendanceInfo: attendanceWithEmployeeInfo,
    });
  } catch (error) {
    console.error("Error filtering employees by date:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  fetchAttendance,
  searchEmployee,
  filterEmployeesByStatus,
  filterEmployeesByDate,
};
