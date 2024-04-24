const express = require("express");
const {
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAllAppointment,
} = require("../controllers/event-controller");
const { isAuthenticated, isHRAdmin } = require("../middleware/auth");
const router = express.Router();
router.post("/createEvent", isAuthenticated, createAppointment);
router.get("/getEvent/:id", isAuthenticated, getAppointment);
router.get("getAllEvents", isAuthenticated, isHRAdmin, getAllAppointment);
router.put("/updateEvent/:id", isAuthenticated, updateAppointment);
router.delete("/deleteEvent/:id", isAuthenticated, deleteAppointment);

module.exports = router;
