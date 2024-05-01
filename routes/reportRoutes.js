const express = require("express");
const router = express.Router();
const { getEmployeeCountByYear,getJobVacancyReport,getRecruitmentReport,
    getEmployeeAttendanceReport ,getAttendanceReport} = require("../controllers/report-controller");

router.get("/countEmployeeByYear", getEmployeeCountByYear);
router.get("/getJobVacancyReport",getJobVacancyReport);
router.get("/getRecruitmentReport",getRecruitmentReport);
router.get("/getAttendanceReport",getAttendanceReport);
router.get("/getEmployeeAttendanceReport/:employeeId", getEmployeeAttendanceReport);

module.exports = router;