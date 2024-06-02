const express = require("express");
const app = express();
const { connectDB } = require("./config/db");
const adminUserRoute = require("./routes/adminusersRoutes");
const siteUserRoute = require("./routes/siteuserRoutes");
const jobRoute = require("./routes/jobRoutes");
const promotionRoute = require("./routes/promotionRoutes");
const leaveRoute = require("./routes/leaveRoutes");
const attendanceRoute = require("./routes/attendanceRoutes");
const employeeRoute = require("./routes/employeeRoutes");
const policyRoutes = require("./routes/policyRoutes");
const newsRoute = require("./routes/newsRoutes");
const employeeReport = require("./routes/reportRoutes.js");
const notificationRoute = require("./routes/notificationRoute.js");
const contactusRoute = require("./routes/contactusRoutes.js");
// const eventRoute = require("./routes/eventRoutes.js");
// const paymentRoute = require("./routes/paymentRoutes.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { performCheckIn } = require("./controllers/attendance-controllers.js");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:3004", credentials: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("welcome");
});
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  pingTimeout: 5000,
  cors: {
    origin: "http://localhost:3003",
  },
});
require("./socketio.js")(io);
app.use(adminUserRoute);
app.use(siteUserRoute);
app.use(jobRoute);
app.use(promotionRoute);
app.use(leaveRoute);
app.use(attendanceRoute);
app.use(employeeRoute);
app.use(newsRoute);
app.use(policyRoutes);
app.use(employeeReport);
app.use(notificationRoute);
app.use(contactusRoute);
// app.use(eventRoute);
// app.use(paymentRoute);
connectDB()
  .then(() => {
    server.listen(process.env.PORT, (req, res) => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
      schedulePeriodicCheckIns(res);
    });
  })
  .catch((err) => console.log(err));

function schedulePeriodicCheckIns(res) {
  setInterval(() => {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();

    if (currentHour >= 7 && currentHour < 24) {
      performCheckIn(res);
    } else {
      console.log("Outside the desired range. Skipping check-in.");
    }
  }, 5000);
}
