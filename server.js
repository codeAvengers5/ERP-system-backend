const express = require("express");
const mongoose = require("mongoose");
const app = express();
const { connectDB } = require("./config/db");
const UserRouter = require("./routes/routers");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(UserRouter)
connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));
