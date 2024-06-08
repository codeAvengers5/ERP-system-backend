const axios = require("axios");
const AppointedEvent = require("../models/appointedEvent.js");
const Payment = require("../models/payment.js");
require("dotenv").config();
const { Chapa } = require("chapa-nodejs");
const User = require("../models/user.js");

const createOrder = async (req, res) => {
  const chapa = new Chapa({
    secretKey: process.env.SECRET_KEY, // Ensure this is the correct key name in your .env file
  });

  try {
    const txRef = await chapa.generateTransactionReference();
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({
        msg: "eventId is required",
      });
    }

    const eventAppointed = await AppointedEvent.findOne({ _id: eventId });
    if (!eventAppointed) {
      return res.status(404).json({
        msg: "Event not found",
      });
    }

    let price;
    if (eventAppointed.with_cash) {
      if (eventAppointed.fasting) {
        price = eventAppointed.no_of_ppl * 45;
      } else {
        price = eventAppointed.no_of_ppl * 75;
      }

      const eventpay = {
        eventId: eventAppointed._id,
        price: price,
        txRef: txRef,
      };

      await Payment.create(eventpay);
    } else {
      return res.status(400).json({
        msg: "Event is not payable with cash",
      });
    }

    const user = await User.findOne({ _id: eventAppointed.user_id });
    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    const chapaRequestData = {
      amount: price,
      tx_ref: txRef,
      currency: "ETB",
      return_url: "https://user-site-production.up.railway.app/events",
    };
    const response = await axios.post(
      `https://api.chapa.co/v1/transaction/initialize`,
      chapaRequestData,
      {
        headers: {
          Authorization: "Bearer " + process.env.SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Chapa API Response:", response.data);

    if (response.data.status === "success") {
      const eventAppointed = await AppointedEvent.findOne({ _id: eventId });
      const payment = await Payment.findOne({ eventId: eventId });
      eventAppointed.paymentStatus = "completed";
      payment.paymentStatus = "completed";
      eventAppointed.save();
      payment.save();
      return res.json({
        msg: "Order created successfully",
        paymentUrl: response.data.data.checkout_url,
      });
    } else {
      return res.status(500).json({
        msg: "Something went wrong",
        details: response.data,
      });
    }
  } catch (error) {
    console.error("Error:", error);

    if (error.response) {
      return res.status(500).json({
        msg: error.response.data,
      });
    } else {
      return res.status(500).json({
        msg: error.message || "Unknown error",
      });
    }
  }
};
module.exports = { createOrder };
