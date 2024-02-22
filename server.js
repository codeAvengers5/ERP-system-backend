const express = require("express");
const mongoose = require("mongoose");
const app = express();
const { connectDB } = require("./config/db");
const User = require("./models/user.js");
require("dotenv").config();
const Contact = require("./models/contact");
const Role = require("./models/role");
const Employee = require("./models/employee");
const JobPost = require("./models/jobPost");
const JobSummary= require("./models/jobSummary");
const Leave = require("./models/leave");
const Attendance = require("./models/attendance");
const AppointedEvent= require("./models/appointedEvent");
const EmployeeInfo= require("./models/employeeInfo");
const News = require("./models/news");
const Policy= require("./models/policy");
const Promotion = require("./models/promotion");
const User= require("./models/user");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Database Connected");
    app.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));