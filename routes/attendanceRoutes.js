const express = require("express");
const router = express.Router();
const {performCheckIn } = require("../controllers/attendance-controllers");
router.get("/check-in",performCheckIn);
module.exports = router;
