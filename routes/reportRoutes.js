const express = require("express");
const router = express.Router();
const { getEmployeeCountByYear,getJobVacancyReport,getRecruitmentReport,
    getEmployeeAttendanceReport ,getAttendanceReport,
    getEventHeldReport,
    getEventAnalytics,
    getLeaveApplicationReport,
    getEmployeeDemographics} = require("../controllers/report-controller");

router.get("/countEmployeeByYear", getEmployeeCountByYear);
router.get("/getJobVacancyReport",getJobVacancyReport);
router.get("/getRecruitmentReport",getRecruitmentReport);
router.get("/getAttendanceReport",getAttendanceReport);
router.get("/getEmployeeAttendanceReport/:employeeId", getEmployeeAttendanceReport);
router.get("/getEventHeldReport",getEventHeldReport)
router.get("/getEventAnalytics",getEventAnalytics)
router.get("/getLeaveApplicationReport",getLeaveApplicationReport)
router.get("/getEmployeeDemographics",getEmployeeDemographics)

module.exports = router;