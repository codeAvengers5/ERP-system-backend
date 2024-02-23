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
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  jobSummary: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobSummary",
    },
  ],
  appointedEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointedEvent",
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
