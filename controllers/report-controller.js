const mongoose = require("mongoose");
const EmployeeInfo = require("../models/employeeInfo");
const JobPost = require("../models/jobPost");
const JobSummary = require("../models/jobSummary");
const Attendance = require("../models/attendance");
const LeaveApplication = require("../models/leaveApplication");
const AppointedEvent = require("../models/appointedEvent");
async function getEmployeeCountByYear(req, res) {
  try {
    const result = await EmployeeInfo.aggregate([
      {
        $group: {
          _id: { $year: "$start_date" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get employee count by year" });
  }
}
async function getJobVacancyReport(req, res) {
  try {
    const result = await JobPost.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$closingDate" },
            year: { $year: "$closingDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get job vacancy" });
    console.log(error);
  }
}
async function getRecruitmentReport(req, res) {
  try {
    const result = await JobSummary.aggregate([
      {
        $match: {
          status: "approved",
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$updatedAt" },
            year: { $year: "$updatedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get recruitment report" });
    console.log(error);
  }
}
async function getAttendanceReport(req, res) {
  try {
    const result = await Attendance.aggregate([
      {
        $unwind: "$attendanceHistory",
      },
      {
        $group: {
          _id: {
            year: { $year: "$attendanceHistory.date" },
            month: { $month: "$attendanceHistory.date" },
            day: { $dayOfMonth: "$attendanceHistory.date" },
            tag: "$attendanceHistory.status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          day: "$_id.day",
          tag: "$_id.tag",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
          day: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get attendance report" });
    console.log(error);
  }
}
async function getEmployeeAttendanceReport(req, res) {
  const { id } = req.params;
  try {
    const result = await Attendance.aggregate([
      {
        $match: {
          employee_id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $unwind: "$attendanceHistory",
      },
      {
        $group: {
          _id: {
            year: { $year: "$attendanceHistory.date" },
            month: { $month: "$attendanceHistory.date" },
            tag: "$attendanceHistory.status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          tag: "$_id.tag",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get attendance report" });
    console.log(error);
  }
}
async function getLeaveApplicationReport(req, res) {
  try {
    const result = await LeaveApplication.aggregate([
      {
        $match: {
          status: "approved",
        },
      },
      {
        $addFields: {
          leave_date: { $toDate: "$leave_date" },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$leave_date" },
            year: { $year: "$leave_date" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get leave application report" });
    console.log(error);
  }
}
async function getEventHeldReport(req, res) {
  try {
    const result = await AppointedEvent.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$date_of_event" },
            year: { $year: "$date_of_event" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to get monthly event held report" });
    console.error(error);
  }
}
async function getEventAnalytics(req, res) {
  try {
    const result = await AppointedEvent.aggregate([
      {
        $group: {
          _id: "$with_cash",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          contributionType: {
            $cond: { if: "$_id", then: "in_cash", else: "in_kind" },
          },
          count: 1,
        },
      },
    ]);
    let inCashCount = 0;
    let inKindCount = 0;
    result.forEach((item) => {
      if (item.contributionType === "in_cash") {
        inCashCount += item.count;
      } else {
        inKindCount += item.count;
      }
    });
    const summary = {
      in_cash: inCashCount,
      in_kind: inKindCount,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to get event analytics" });
    console.error(error);
  }
}
async function getTotalAttendees(req, res) {
  try {
    const result = await AppointedEvent.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: "$no_of_ppl" },
        },
      },
      {
        $project: {
          _id: 0,
          count: 1,
        },
      },
    ]);
    if (result.length === 0) {
      res.json({ count: 0 });
    } else {
      res.json(result[0]);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to get total attendees" });
    console.error(error);
  }
}
async function getEmployeeDemographics(req, res) {
  try {
    const ageCount = await EmployeeInfo.aggregate([
      {
        $match: {
          dob: { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          age: {
            $subtract: [
              { $year: new Date() },
              { $year: "$dob" }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$age",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
const genderCount = await EmployeeInfo.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          gender: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);
const positionCount = await EmployeeInfo.aggregate([
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          position: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      ageCount,
      genderCount,
      positionCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

module.exports = {
  getEmployeeCountByYear,
  getJobVacancyReport,
  getRecruitmentReport,
  getAttendanceReport,
  getEmployeeAttendanceReport,
  getLeaveApplicationReport,
  getEventHeldReport,
  getEventAnalytics,
  getTotalAttendees,
  getEmployeeDemographics
};
