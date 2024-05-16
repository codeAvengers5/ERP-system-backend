const express = require("express");
const {
  markAllNotificationsAsRead,
} = require("../controllers/notification-controller");
const router = express.Router();

router.post("/markasread", markAllNotificationsAsRead);
module.exports = router;
