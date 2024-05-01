const mongoose = require("mongoose");
const EmployeeInfo = require("../models/employeeInfo");
const JobPost = require("../models/jobPost");
const JobSummary = require("../models/jobSummary");
const Attendance = require("../models/attendance");
async function getEmployeeCountByYear(req,res) {
    try {
      const result = await EmployeeInfo.aggregate([
        {
          $group: {
            _id: { $year: "$start_date" }, // Group by the year of the "createdAt" field
            count: { $sum: 1 }, // Count the number of employees in each group
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
            year: 1, // Sort the results by year in ascending order
          },
        },
      ]);
  
      res.json(result);
    } catch (error) {
        res.status(500).json({ error:"Failed to get employee count by year" });
    }
  }
  async function getJobVacancyReport(req, res) {
    try {
      const result = await JobPost.aggregate([
        {
          $group: {
            _id: {
              month: { $month: '$closingDate' },
              year: { $year: '$closingDate' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            month: '$_id.month',
            year: '$_id.year',
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
      res.status(500).json({ error: 'Failed to get job vacancy' });
      console.log(error);
    }
  }
  async function getRecruitmentReport(req,res) {
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
              month: { $month: '$updatedAt' },
              year: { $year: '$updatedAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            month: '$_id.month',
            year: '$_id.year',
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
      console.log(result)
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recruitment report' });
      console.log(error);
    }
  }
  async function getAttendanceReport(req,res) {
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
      console.log(result)
    } catch (error) {
      res.status(500).json({ error: 'Failed to get attendance report' });
      console.log(error);
    }
  }
  async function getEmployeeAttendanceReport(req, res) {
    const { employeeId } = req.params;
  
    try {
      const result = await Attendance.aggregate([
        {
          $match: {
            employee_id: new mongoose.Types.ObjectId(employeeId),
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
      res.status(500).json({ error: 'Failed to get attendance report' });
      console.log(error);
    }
  }
  module.exports={
    getEmployeeCountByYear,
    getJobVacancyReport,
    getRecruitmentReport,
    getAttendanceReport,
    getEmployeeAttendanceReport
  }