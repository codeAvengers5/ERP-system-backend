const express = require("express");
const router = express.Router();

const {
  createLeaveApplication,
  getAllLeaveApplications,
  getLeaveApplicationById,
  updateLeaveApplication,
  deleteLeaveApplication,
  getAllLeaveApplicationsByEmployee,
} = require("../controllers/leave-controller");
const { isAuthenticated, isEmployee ,isHRAdmin} = require("../middleware/auth");


router.post("/leaveapplications/:id",isAuthenticated, isEmployee, createLeaveApplication);

router.get("/leaveapplications",isAuthenticated, isHRAdmin, getAllLeaveApplications);

router.get("/leaveapplications/:id", isAuthenticated,[isHRAdmin, isEmployee],getLeaveApplicationById);

router.put("/leaveapplications/:id",isAuthenticated, [isHRAdmin, isEmployee], updateLeaveApplication);

router.delete("/leaveapplications/:id",isAuthenticated, isEmployee, deleteLeaveApplication);

router.get("/leaveapplications/employee/:id", isAuthenticated, [isHRAdmin, isEmployee], getAllLeaveApplicationsByEmployee);
module.exports = router;