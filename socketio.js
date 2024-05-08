const {
  getNotificationsByRole,
  getSiteUserNotifications,
} = require("./controllers/notification-controller");
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (io) {
  io.on("connection", (socket) => {
    console.log("A client connected");
    socket.on("authenticate", async (user) => {
      if (user && user.userInfo.roleName) {
        console.log("An Admin client connected");
        getNotificationsByRole(user.userInfo.roleName, user.userInfo.accountId)
          .then((notifications) => {
            socket.emit("initial-notifications", notifications);
            console.log("Emitting notifications based on role", notifications);
          })
          .catch((err) => {
            console.error("Error retrieving initial notifications:", err);
          });
      } else if (user && user.id) {
        console.log("A Site user client connected");
        getSiteUserNotifications(user.id)
          .then((notifications) => {
            socket.emit("initial-notifications", notifications);
            console.log("Emitting notifications for site users", notifications);
          })
          .catch((err) => {
            console.error(
              "Error retrieving initial notifications for site users:",
              err
            );
          });
      }
    });

    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });

  io.on("error", (error) => {
    console.error("Socket.IO error:", error);
  });
};
