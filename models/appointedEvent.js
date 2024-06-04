const mongoose = require("mongoose");

const appointedEventSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
  },
  no_of_ppl: {
    type: Number,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  fasting: {
    type: Boolean,
    default: false,
  },
  phone_no: {
    type: String,
    required: true,
  },
  date_of_event: {
    type: Date,
    required: true,
  },
  food_time: {
    type: String,
    enum: ["Breakfast", "Lunch", "Dinner"],
    default: "Lunch",
  },
  with_cash: {
    type: Boolean,
    default: null,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
});

const AppointedEvent = mongoose.model("AppointedEvent", appointedEventSchema);

module.exports = AppointedEvent;