const axios = require("axios");
const nanoid = require("uuid");
const AppointedEvent = require("../models/appointedEvent.js");
const Payment = require("../models/payment.js");
const createOrder = async (req, res) => {
  try {
    const { eventId } = req.body;
    // const amounts = req.body.amount;
    // const productId = req.body.id;
    // const txRef = req.body.tx_ref;
    if (!eventId) {
      return res.status(400).json({
        msg: "eventId is required",
      });
    }
    let eventpay;
    const eventAppointed = await AppointedEvent.findOne({ _id: eventId });
    if (eventAppointed) {
      const txRef = nanoid();
      let price;
      if (eventAppointed.with_cash) {
        if (eventAppointed.fasting) {
          price = no_of_ppl * 45;
        } else {
          price = no_of_ppl * 75;
        }
        eventpay = {
          eventId: eventAppointed._id,
          price: price,
          txRef: txRef,
        };
        await Payment.create(eventpay);
      }

      res.status(201).json(eventAppointed);
    } else {
      return res.status(404).json({
        msg: "Event not found",
      });
    }

    let chapaRequestData = {
      amount: eventpay.price,
      tx_ref: txRef,
      currency: "ETB",
      // return_url: `https://api.chapa.co/v1/transaction/verify/${txRef}`,
      return_url: "http://localhost/3000/ticket",
    };
    const response = await axios.post(
      `https://api.chapa.co/v1/transaction/initialize`,
      chapaRequestData,
      {
        headers: {
          Authorization: "Bearer " + process.env.CHAPA_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response);
    if (response.data["status"] == "success") {
      return res.json({
        msg: "Order created successfully",
        paymentUrl: response.data["data"]["checkout_url"],
      });
    } else {
      return res.json({
        msg: "Something went wrong",
      });
    }
  } catch (error) {
    if (error.response) {
      return res.status(500).json({
        msg: error.response.data,
      });
    } else {
      return res.status(500).json({
        msg: "error",
      });
    }
  }
};
module.exports = { createOrder };
