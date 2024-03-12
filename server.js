const express = require("express");
const app = express();
const http = require("http");
const { connectDB } = require("./config/db");
const adminUserRoute = require("./routes/adminusersRoutes");
const siteUserRoute = require("./routes/siteuserRoutes");
const jobRoute = require("./routes/jobRoutes");
const promotionRoute = require("./routes/promotionRoutes");
const leaveRoute = require("./routes/leaveRoutes");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const socketIO = require("socket.io");
const socketioJwt = require("socketio-jwt");
const cors = require("cors");
const {
  getNotificationsByRole,
} = require("./controllers/notification-controllers");

require("dotenv").config();
app.use(cookieParser());
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server);
io.use(
  socketioJwt.authorize({
    secret: process.env.JWT_TOKEN_KEY,
    timeout: 3000,
    handshake: true,
  })
);
io.on("connection", (socket) => {
  console.log("A client connected");
  const req = socket.decoded_token;
  const userRole = req.role;
  console.log(userRole);
  if (req && req.role) {
    console.log("An Admin client connected");
    getNotificationsByRole(userRole)
      .then((notifications) => {
        socket.emit("initial-notifications", notifications);
        console.log("Emitting notifications", notifications);
      })
      .catch((err) => {
        console.error("Error retrieving initial notifications:", err);
      });
  }
  socket.on("disconnect", () => {
    console.log("An Admin client disconnected");
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 },
  })
);
app.use(adminUserRoute);
app.use(siteUserRoute);
app.use(jobRoute);
app.use(promotionRoute);
app.use(leaveRoute);
connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
