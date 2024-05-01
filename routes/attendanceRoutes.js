const express = require("express");
const { searchEmployee, filterEmployeesByStatus, filterEmployeesByDate, fetchAttendanceInfo,getAttendanceCounts } = require("../controllers/attendance-controllers");
const { isHRAdmin, isAuthenticated } = require("../middleware/auth");
const router = express.Router();
router.get("/getemployeeinfo",fetchAttendanceInfo)
// router.get("/employeeattendanceinfo/:id",getAttendancefor_Employee)
router.get("/searchemployee", isAuthenticated, isHRAdmin, searchEmployee);
router.get("/filterbystatus", isAuthenticated, isHRAdmin, filterEmployeesByStatus);
router.get("/filterbydate", isAuthenticated, isHRAdmin, filterEmployeesByDate);
router.get("/getattendancecount",isAuthenticated,isHRAdmin,getAttendanceCounts)
module.exports = router;
