const AppointedEvent = require("../models/appointedEvent");
const nanoid = require("uuid");
const Payment = require("../models/payment");
async function createAppointment(req, res) {
  try {
    const {
      no_of_ppl,
      full_name,
      fasting,
      phone_no,
      date_of_event,
      food_time,
      with_cash,
    } = req.body;

    const appointmentData = {
      no_of_ppl,
      full_name,
      fasting,
      phone_no,
      date_of_event,
      food_time,
      with_cash,
      user_id: req.user.id,
    };

    const appointment = new AppointedEvent(appointmentData);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create appointment" });
  }
}
async function getAppointment(req, res) {
  try {
    const appointmentId = req.params.id;
    const appointment = await AppointedEvent.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to get appointment" });
  }
}
async function getAllAppointment(req, res) {
  try {
    const appointments = await AppointedEvent.find();

    if (appointments.length === 0) {
      return res.status(404).json({ error: "No appointments found" });
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to get appointments" });
  }
}
async function updateAppointment(req, res) {
  try {
    const appointmentId = req.params.id;
    const updateData = req.body;
    const updatedAppointment = await AppointedEvent.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update appointment" });
  }
}
async function deleteAppointment(req, res) {
  try {
    const appointmentId = req.params.id;

    const deletedAppointment = await AppointedEvent.findByIdAndDelete(
      appointmentId
    );

    if (!deletedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete appointment" });
  }
}

async function verifyPayment(req, res) {
  try {
    const hash = crypto
      .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (hash == req.headers["x-chapa-signature"]) {
      const event = req.query;

      const { tx_ref, status } = event;
      if (status == "success" && tx_ref) {
        const response = await axios.get(
          `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,

          {
            headers: {
              Authorization: "Bearer " + process.env.CHAPA_KEY,
            },
          }
        );
        if (response.status == 200) {
          if (response.data["status"] == "success") {
            let tx_ref = response.data["data"]["tx_ref"];
            const order = await AppointedEvent.findOne({
              txRef: tx_ref,
            });
            // check if the order doesn't exist or payment status is not pending
            if (!order || order.paymentStatus != "pending") {
              // Return a response to acknowledge receipt of the event
              return res.sendStatus(200);
            }
            if (order.paymentStatus == "pending") {
              order.paymentStatus = "completed";
              await order.save();
              // Return a response to acknowledge receipt of the event
              return res.sendStatus(200);
            }
          }
        }
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: err.message });
  }
}

module.exports = {
  createAppointment,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAllAppointment,
  verifyPayment,
};
