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
      return_url: "http://localhost:3000/events",
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
      const payment = await Payment.findOne({ _id: eventId });
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

// async function verifyPayment(req, res) {
//   try {
//     const hash = crypto
//       .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET)
//       .update(JSON.stringify(req.body))
//       .digest("hex");
//     if (hash == req.headers["x-chapa-signature"]) {
//       const event = req.query;

//       const { tx_ref, status } = event;
//       if (status == "success" && tx_ref) {
//         const response = await axios.get(
//           `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,

//           {
//             headers: {
//               Authorization: "Bearer " + process.env.CHAPA_KEY,
//             },
//           }
//         );
//         if (response.status == 200) {
//           if (response.data["status"] == "success") {
//             let tx_ref = response.data["data"]["tx_ref"];
//             const order = await AppointedEvent.findOne({
//               txRef: tx_ref,
//             });
//             // check if the order doesn't exist or payment status is not pending
//             if (!order || order.paymentStatus != "pending") {
//               // Return a response to acknowledge receipt of the event
//               return res.sendStatus(200);
//             }
//             if (order.paymentStatus == "pending") {
//               order.paymentStatus = "completed";
//               await order.save();
//               // Return a response to acknowledge receipt of the event
//               return res.sendStatus(200);
//             }
//           }
//         }
//       }
//     }
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ msg: err.message });
//   }
// }
module.exports = { createOrder };
