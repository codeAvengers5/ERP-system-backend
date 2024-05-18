const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AppointedEvent",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  txRef: {
    type: String,
    required: true,
  },
});

const Payment = mongoose.model("EventPayment", paymentSchema);

module.exports = Payment;
