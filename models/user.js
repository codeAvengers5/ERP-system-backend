const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmationCode: {
    type: String,
    allowNull: true,
    defaultValue: "null",
  },
  isConfirmed: {
    type: Boolean,
    allowNull: false,
    defaultValue: false,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
