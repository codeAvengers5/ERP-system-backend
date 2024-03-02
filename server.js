const express = require("express");
const mongoose = require("mongoose");
const app = express();
const { connectDB } = require("./config/db");
const adminUserRoute = require("./routes/adminusersRoutes");
const siteUserRoute = require("./routes/siteuserRoutes");
const jobRoute = require("./routes/jobRoutes");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 }
  })
);
app.use(adminUserRoute);
app.use(siteUserRoute);
app.use(jobRoute)
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
