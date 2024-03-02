const express = require("express");
const {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPostById,
  deleteJobPostById,
} = require("../controllers/jobpost-controller");
const router = express.Router();
const {
  isAuthenticated,
  isHRAdmin,
} = require("../middleware/auth");

const { ViewJob, JobApply } = require("../controllers/jobapply-contollers");
const {
  ViewJob,
  JobApply,
  JobSummary,
} = require("../controllers/jobapply-contollers");
const { uploadCV } = require("../config/multer");
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");
router.post("/createJobPosts", isAuthenticated, isHRAdmin, createJobPost);
router.get("/getJobPosts", isAuthenticated, isHRAdmin, getAllJobPosts);
router.get("/getJobPostsId/:id", isAuthenticated, isHRAdmin, getJobPostById);
router.put(
  "/updateJobPosts/:id",
  isAuthenticated,
  isHRAdmin,
  updateJobPostById
);
router.delete(
  "/deleteJobPosts/:id",
  isAuthenticated,
  isHRAdmin,
  deleteJobPostById
);
router.get("/joblist", ViewJob);
router.post("/jobapply/:id", uploadCV.single("cv"), JobApply);
router.get("/jobsummary", isAuthenticated, isHRAdmin, JobSummary);
module.exports = router;
