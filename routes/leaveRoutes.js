const express = require("express");
const router = express.Router();

const {
  createLeaveApplication,
  updateLeaveApplication,
  deleteLeaveApplication,
  getLeaveApplication_forEmployee,
  getAllLeaveApplications_forHR,
  updateStatus,
  filterByStatus,
} = require("../controllers/leaveapplication-controller");
const {
  isAuthenticated,
  isEmployee,
  isHRAdmin,
} = require("../middleware/auth");

router.post(
  "/leaveapplications",
  isAuthenticated,
  isEmployee,
  createLeaveApplication
);
router.get(
  "/leaveapplication_filter",
  isAuthenticated,
  isHRAdmin,
  filterByStatus
);
router.get(
  "/leaveapplications_hr",
  isAuthenticated,
  isHRAdmin,
  getAllLeaveApplications_forHR
);
router.get(
  "/leaveapplications_employee",
  isAuthenticated,
  isEmployee,
  getLeaveApplication_forEmployee
);
router.put(
  "/leaveapplications/:id",
  isAuthenticated,
  isEmployee,
  updateLeaveApplication
);
router.put(
  "/leaveapplication_status/:id",
  isAuthenticated,
  isHRAdmin,
  updateStatus
);
router.delete(
  "/leaveapplications/:id",
  isAuthenticated,
  isEmployee,
  deleteLeaveApplication
);
module.exports = router;
