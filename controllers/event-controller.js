const AppointedEvent = require("../models/appointedEvent");
const nanoid = require("uuid");
const Payment = require("../models/payment");
const { eventNames } = require("process");
async function createAppointment(req, res) {
  try {
    const {
      event_type,
      no_of_ppl,
      full_name,
      fasting,
      phone_no,
      date_of_event,
      food_time,
      with_cash,
    } = req.body;

    const appointmentData = {
      event_type,
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
    // console.log(error);
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
async function getUserAppointment(req, res) {
  try {
    const userId = req.params.id;
    const appointment = await AppointedEvent.findById({ user_id: userId });

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
    return res.status(404).json({ error: 'No appointments found' });
  }

  return res.status(200).json(appointments);
} catch (error) {
  return res.status(500).json({ error: error.message });
}
}
// async function updateAppointment(req, res) {
//   try {
//     const appointmentId = req.params.id;
//     const updateData = req.body;
//     const event = AppointedEvent.findById(appointmentId);
//     // if (event.paymentStatus == "completed") {
//     //   res.status(401).json({ msg: "Can not update" });
//     // }
//     if (event && event.paymentStatus === 'completed') {
//       return res.status(401).json({ msg: "Can not update" });
//     }
//     console.log("payment status", event.paymentStatus)
//     const updatedAppointment = await AppointedEvent.findByIdAndUpdate(
//       appointmentId,
//       updateData,
//       { new: true }
//     );

//     if (!updatedAppointment) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     res.status(200).json(updatedAppointment);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to update appointment" });
//   }
// }
async function updateAppointment(req, res) {
  try {
    const appointmentId = req.params.id;
    const updateData = req.body;

    // Fetch the appointment
    const appointment = await AppointedEvent.findById(appointmentId);

    // Check if the appointment has been paid for
    if (appointment && appointment.paymentStatus === "completed") {
      return res.status(401).json({ msg: "Can not update" });
    }
    // Update the appointment
    const updatedAppointment = await AppointedEvent.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    );

    // Handle the case where the appointment is not found
    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Return the updated appointment
    res.status(200).json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update appointment" });
  }
}
// async function deleteAppointment(req, res) {
//   try {
//     const appointmentId = req.params.id;
//     const event = AppointedEvent.findById(appointmentId);
//     if (event.paymentStatus == "completed") {
//       res.status(401).json({ msg: "Can not delete" });
//     }
//     const deletedAppointment = await AppointedEvent.findByIdAndDelete(
//       appointmentId
//     );

//     if (!deletedAppointment) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }

//     res.json({ message: "Appointment deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to delete appointment" });
//   }
// }
async function deleteAppointment(req, res) {
  try {
    const appointmentId = req.params.id;
    const deletedAppointment = await AppointedEvent.findByIdAndDelete(appointmentId);

    if (!deletedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (deletedAppointment.paymentStatus === 'completed') {
      return res.status(401).json({ msg: "Cannot delete a paid appointment" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    // console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Failed to delete appointment" });
  }
}
module.exports = {
  createAppointment,
  getAppointment,
  getUserAppointment,
  updateAppointment,
  deleteAppointment,
  getAllAppointment,
};
