const express = require("express");
const app = express();
const { connectDB } = require("./config/db");
const adminUserRoute = require("./routes/adminusersRoutes");
const siteUserRoute = require("./routes/siteuserRoutes");
const jobRoute = require("./routes/jobRoutes");
const promotionRoute = require("./routes/promotionRoutes");
const leaveRoute = require("./routes/leaveRoutes");
const cookieParser = require("cookie-parser");
// const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(adminUserRoute);
app.use(siteUserRoute);
app.use(jobRoute);
app.use(promotionRoute);
app.use(leaveRoute);
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
