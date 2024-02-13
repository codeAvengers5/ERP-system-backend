const express = require("express");
const mongoose = require("mongoose");
const app = express();
const { connectDB } = require("./config/db");
const User = require("./models/user.js");
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/api", userRouter);
app.get("/", (req, res) => {
  res.send("Hello world!");
});
app.post("/user", async (req, res) => {
  const { name, email, password } = req.body;

  const user = User({
    name,
    email,
    password
  });
  await user.save();
  console.log(user);
  res.send(user)
});

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Database Connected");
    app.listen(process.env.PORT, () => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));