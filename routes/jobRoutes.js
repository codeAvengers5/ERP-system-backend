const express = require("express");
const {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPostById,
  deleteJobPostById,
} = require("../controllers/jobpost-contollers");
const router = express.Router();
const {ViewJob, JobApply,ViewJobSummary} = require("../controllers/jobapply-contollers");
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
router.get("/jobsummary", isAuthenticated, isHRAdmin, ViewJobSummary);
module.exports = router;
