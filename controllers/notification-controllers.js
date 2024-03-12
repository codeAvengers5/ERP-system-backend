const Notification = require("../models/notification");
async function getNotificationsByRole(role) {
  return await Notification.find({ recipient: role }).exec();
}

module.exports = { getNotificationsByRole };
