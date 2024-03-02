const express = require("express");
const { ViewJob, JobApply, JobSummary } = require("../controllers/jobapply-contollers");
const { uploadCV } = require("../config/multer");
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");
const router = express.Router();
router.get("/joblist", ViewJob);
router.post("/jobapply/:id", uploadCV.single("cv"), JobApply);
router.get("/jobsummary", isAuthenticated,isHRAdmin,JobSummary)
module.exports = router;
