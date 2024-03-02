const express = require("express");
const mongoose = require("mongoose");
const app = express();
const { connectDB } = require("./config/db");
const adminUserRoute = require("./routes/adminusersRoutes");
const siteUserRoute = require("./routes/siteuserRoutes");
const promotionRoute = require("./routes/promotionRoutes");
const jobPostRoute = require("./routes/jobRoutes");
const cookieParser = require("cookie-parser");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(adminUserRoute);
app.use(siteUserRoute);
app.use(promotionRoute);
app.use(jobPostRoute);


connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
