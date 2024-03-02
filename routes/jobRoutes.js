const express = require("express");
const { ViewJob, JobApply } = require("../controllers/jobapply-contollers");
const { uploadCV } = require("../config/multer");
const router = express.Router();

router.get("/joblist", ViewJob);
router.post("/jobapply/:id", uploadCV.single("cv"), JobApply);
module.exports = router;
