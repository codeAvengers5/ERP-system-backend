const express = require("express");
const { fetchAttendance } = require("../controllers/attendance-controllers");
const router = express.Router();
router.post("/fetchingattendance", fetchAttendance);
module.exports = router;
