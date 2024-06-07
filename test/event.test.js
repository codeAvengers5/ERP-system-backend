
const request = require('supertest');
const express = require('express');
const app = express();
const AppointedEvent = require('../models/appointedEvent');
const appointmentController = require('../controllers/event-controller');

app.use(express.json());
app.post('/appointments', appointmentController.createAppointment);
app.get('/appointments/:id', appointmentController.getAppointment);
app.get('/appointments/user/:id', appointmentController.getUserAppointment);
app.get('/appointments', appointmentController.getAllAppointment);
app.put('/appointments/:id', appointmentController.updateAppointment);
app.delete('/appointments/:id', appointmentController.deleteAppointment);
jest.mock('../models/appointedEvent');

describe('Appointment Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      const req = {
        body: {
          event_type: 'Wedding',
          no_of_ppl: 100,
          full_name: 'John Doe',
          fasting: false,
          phone_no: '1234567890',
          date_of_event: '2023-06-01',
          food_time: '12:00',
          with_cash: true,
          user_id: '123456789'
        },
        user: {
          id: '123456789'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const appointment = {
        save: jest.fn().mockResolvedValue(true)
      };
      AppointedEvent.mockImplementation(() => appointment);

      await appointmentController.createAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(appointment);
    });

    it('should return a 500 error if there is an error creating the appointment', async () => {
      const req = {
        body: {
          event_type: 'Wedding',
          no_of_ppl: 100,
          full_name: 'John Doe',
          fasting: false,
          phone_no: '1234567890',
          date_of_event: '2023-06-01',
          food_time: '12:00',
          with_cash: true,
          user_id: '123456789'
        },
        user: {
          id: '123456789'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockError = new Error('Failed to create appointment');
      const appointment = {
        save: jest.fn().mockRejectedValue(mockError)
      };
      AppointedEvent.mockImplementation(() => appointment);

      await appointmentController.createAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create appointment' });
    });
  });

  describe('getAppointment', () => {
    it('should get an appointment by id', async () => {
      const req = {
        params: {
          id: '123456789'
        }
      };
      const res = {
        json: jest.fn()
      };

      const appointment = {
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 100,
        full_name: 'John Doe',
        fasting: false,
        phone_no: '1234567890',
        date_of_event: '2023-06-01',
        food_time: '12:00',
        with_cash: true,
        user_id: '123456789'
      };
      AppointedEvent.findById.mockResolvedValue(appointment);

      await appointmentController.getAppointment(req, res);

      expect(res.json).toHaveBeenCalledWith(appointment);
    });

    it('should return a 404 error if the appointment is not found', async () => {
      const req = {
        params: {
          id: '123456789'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      AppointedEvent.findById.mockResolvedValue(null);

      await appointmentController.getAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Appointment not found' });
    });

    it('should return a 500 error if there is an error getting the appointment', async () => {
      const req = {
        params: {
          id: '123456789'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockError = new Error('Failed to get appointment');
      AppointedEvent.findById.mockRejectedValue(mockError);

      await appointmentController.getAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get appointment' });
    });
  });

  describe('getUserAppointment', () => {
    it('should get an appointment by user id', async () => {
      const req = {
        params: {
          id: '123456789'
        }
      };
      const res = {
        json: jest.fn()
      };

      const appointment = {
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 100,
        full_name: 'John Doe',
        fasting: false,
        phone_no: '1234567890',
        date_of_event: '2023-06-01',
        food_time: '12:00',
        with_cash: true,
        user_id: '123456789'
      };
      AppointedEvent.findById.mockResolvedValue(appointment);

      await appointmentController.getUserAppointment(req, res);

      expect(res.json).toHaveBeenCalledWith(appointment);
    });

    it('should return a 404 error if the appointment is not found', async () => {
      const req = {
        params: {
          id: '123456789'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      AppointedEvent.findById.mockResolvedValue(null);

      await appointmentController.getUserAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Appointment not found' });
    });

    it('should return a 500 error if there is an error getting the appointment', async () => {
      const req = {
        params: {
          id: '123456789'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const mockError = new Error('Failed to get appointment');
      AppointedEvent.findById.mockRejectedValue(mockError);

      await appointmentController.getUserAppointment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get appointment' });
    });
  });
  describe('getAllAppointment', () => {
    it('should return all appointments', async () => {
      const req = {
        query: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      const appointments = [
        { id: '1', event_type: 'Wedding', no_of_ppl: 100 },
        { id: '2', event_type: 'Birthday', no_of_ppl: 50 },
        { id: '3', event_type: 'Anniversary', no_of_ppl: 75 }
      ];
      AppointedEvent.find = jest.fn().mockResolvedValue(appointments);
  
      await appointmentController.getAllAppointment(req, res);
  
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(appointments);
    });
  
    it('should return a 404 error if there are no appointments', async () => {
      const req = {
        query: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      AppointedEvent.find = jest.fn().mockResolvedValue([]);
  
      await appointmentController.getAllAppointment(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'No appointments found' });
    });
  
    it('should return a 500 error if there is an error getting the appointments', async () => {
      const req = {
        query: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      const mockError = new Error('Failed to get appointments');
      AppointedEvent.find = jest.fn().mockRejectedValue(mockError);
  
      await appointmentController.getAllAppointment(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: mockError.message });
    });
  });

  describe('updateAppointment', () => {
    it('should update an appointment', async () => {
      const req = {
        params: {
          id: '123456789'
        },
        body: {
          no_of_ppl: 150,
          food_time: '13:00'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      const appointment = {
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 100,
        paymentStatus: 'pending'
      };
      AppointedEvent.findById = jest.fn().mockResolvedValue(appointment);
      AppointedEvent.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 150,
        food_time: '13:00'
      });
  
      await appointmentController.updateAppointment(req, res);

      expect(AppointedEvent.findById).toHaveBeenCalledWith('123456789');
      expect(AppointedEvent.findByIdAndUpdate).toHaveBeenCalledWith(
        '123456789',
        { no_of_ppl: 150, food_time: '13:00' },
        { new: true }
      );
      expect(res.status).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 150,
        food_time: '13:00'
      });
    });
  
    it('should return a 401 error if the appointment has been paid for', async () => {
      const req = {
        params: {
          id: '123456789'
        },
        body: {
          no_of_ppl: 150,
          food_time: '13:00'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
    
      const appointment = {
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 100,
        paymentStatus: "completed"
      };
      AppointedEvent.findById = jest.fn().mockResolvedValue(appointment);
    
      await appointmentController.updateAppointment(req, res);
    
      expect(AppointedEvent.findById).toHaveBeenCalledWith('123456789');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Can not update' });
    });
    it('should return a 500 error if there is an error updating the appointment', async () => {
      const req = {
        params: {
          id: '123456789'
        },
        body: {
          no_of_ppl: 150,
          food_time: '13:00'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      const mockError = new Error('Failed to update appointment');
      AppointedEvent.findById = jest.fn().mockResolvedValue({
        _id: '123456789',
        event_type: 'Wedding',
        no_of_ppl: 100,
        paymentStatus: 'pending'
      });
      AppointedEvent.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);
  
      await appointmentController.updateAppointment(req, res);
  
      expect(AppointedEvent.findById).toHaveBeenCalledWith('123456789');
      expect(AppointedEvent.findByIdAndUpdate).toHaveBeenCalledWith(
        '123456789',
        { no_of_ppl: 150, food_time: '13:00' },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update appointment' });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete an appointment successfully', async () => {
      const appointmentId = '66178d85cb7482c1db72e248';
      const deletedAppointment = {
        _id: appointmentId,
        paymentStatus: 'pending',
      };
  
      AppointedEvent.findByIdAndDelete.mockResolvedValueOnce(deletedAppointment);
  
      const response = await request(app)
        .delete(`/appointments/${appointmentId}`)
        .expect(200);
  
      expect(response.body).toEqual({ message: 'Appointment deleted successfully' });
      expect(AppointedEvent.findByIdAndDelete).toHaveBeenCalledWith(appointmentId);
    });
  
    it('should return 404 if appointment not found', async () => {
      const appointmentId = '66178d85cb7482c1db72e248';
  
      AppointedEvent.findByIdAndDelete.mockResolvedValueOnce(null);
  
      const response = await request(app)
        .delete(`/appointments/${appointmentId}`)
        .expect(404);
  
      expect(response.body).toEqual({ error: 'Appointment not found' });
      expect(AppointedEvent.findByIdAndDelete).toHaveBeenCalledWith(appointmentId);
    });
  
    it('should return 401 if appointment is paid', async () => {
      const appointmentId = '66178d85cb7482c1db72e248';
      const deletedAppointment = {
        _id: appointmentId,
        paymentStatus: 'completed',
      };
  
      AppointedEvent.findByIdAndDelete.mockResolvedValueOnce(deletedAppointment);
  
      const response = await request(app)
        .delete(`/appointments/${appointmentId}`)
        .expect(401);
  
      expect(response.body).toEqual({ msg: 'Cannot delete a paid appointment' });
      expect(AppointedEvent.findByIdAndDelete).toHaveBeenCalledWith(appointmentId);
    });
  
    it('should return 500 if there is an error', async () => {
      const appointmentId = '66178d85cb7482c1db72e248';
      const error = new Error('Database error');
  
      AppointedEvent.findByIdAndDelete.mockRejectedValueOnce(error);
  
      const response = await request(app)
        .delete(`/appointments/${appointmentId}`)
        .expect(500);
  
      expect(response.body).toEqual({ error: 'Failed to delete appointment' });
      expect(AppointedEvent.findByIdAndDelete).toHaveBeenCalledWith(appointmentId);
    });
  });
});
