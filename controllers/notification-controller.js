const Notification = require("../models/notification");
const SiteUserNotification = require("../models/siteuserNotification");

async function getNotificationsByRole(role, id) {
  return await Notification.find({
    recipient: role,
    read: false,
    employeeId: id,
  }).exec();
}

const getSiteUserNotifications = async (userId) => {
  try {
    const notifications = await SiteUserNotification.find({ userId: userId });
    return notifications;
  } catch (err) {
    throw new Error("Failed to retrieve notifications for site user");
  }
};
async function markAllNotificationsAsRead(req, res) {
  const { role, id } = req.body;
  try {
    const notifications = await Notification.find({
      recipient: role.role,
      employeeId: role.id,
    }).exec();
    for (const notification of notifications) {
      notification.read = true;
      await notification.save();
    }
    return notifications;
  } catch (error) {
    console.log("Error marking notifications as read:", error);
  }
}
module.exports = {
  getNotificationsByRole,
  getSiteUserNotifications,
  markAllNotificationsAsRead,
};
