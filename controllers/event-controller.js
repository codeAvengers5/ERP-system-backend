
const AppointedEvent = require('../models/appointedEvent');
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
      const savedAppointment = await appointment.save();
  
      // Handle payment logic if necessary
    //   if (savedAppointment.with_cash) {
    //     // Forward the appointment and payment information to the payment controller for processing
    //     // PaymentController.processPayment(savedAppointment);
    //   }
  
      res.status(201).json(savedAppointment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  }
  async function getAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
      const appointment = await AppointedEvent.findById(appointmentId);
  
      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
  
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get appointment' });
    }
  }
  async function getAllAppointment(req, res) {
    try {
      const appointments = await AppointedEvent.find();
  
      if (appointments.length === 0) {
        return res.status(404).json({ error: 'No appointments found' });
      }
    
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get appointments' });
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
        return res.status(404).json({ error: 'Appointment not found' });
      }
  
      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update appointment' });
    }
  }
  async function deleteAppointment(req, res) {
    try {
      const appointmentId = req.params.id;
  
      const deletedAppointment = await AppointedEvent.findByIdAndDelete(appointmentId);
  
      if (!deletedAppointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
  
      res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  }
  
  module.exports = {
    createAppointment,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    getAllAppointment
  };