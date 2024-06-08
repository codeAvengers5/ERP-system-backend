const express = require("express");
const {
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAllAppointment,
  getUserAppointment,
} = require("../controllers/event-controller");
const { isUserAuthenticated } = require("../middleware/auth-user");
const { isHRAdmin, isAuthenticated } = require("../middleware/auth");
const router = express.Router();
router.post("/createEvent", isUserAuthenticated, createAppointment);
router.get("/getEvent/:id", isUserAuthenticated, getAppointment);
router.get("/getuserEvent", isUserAuthenticated, getUserAppointment);
router.get("/getAllEvents", isAuthenticated, isHRAdmin, getAllAppointment);
router.put("/updateEvent/:id", isUserAuthenticated, updateAppointment);
router.delete("/deleteEvent/:id", isUserAuthenticated, deleteAppointment);

module.exports = router;
