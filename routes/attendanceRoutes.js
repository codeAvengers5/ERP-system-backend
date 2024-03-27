const express = require("express");
const {
  fetchAttendance,
  searchEmployee,
  filterEmployeesByDate,
  filterEmployeesByStatus,
} = require("../controllers/attendance-controllers");
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");
const router = express.Router();
router.post("/fetchingattendance", fetchAttendance);
router.get("/searchemployee", isAuthenticated, isHRAdmin, searchEmployee);
router.get("/filterbystatus", isAuthenticated, isHRAdmin, filterEmployeesByStatus);
router.get("/filterbydate", isAuthenticated, isHRAdmin, filterEmployeesByDate);
module.exports = router;
